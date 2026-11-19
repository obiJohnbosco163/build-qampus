import { createHmac, timingSafeEqual } from 'node:crypto'
import { verifySiwq, type SiwqSignature } from '@qorechain/qoresign'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const cookieName = 'qampus_wallet_challenge'
const chainId = 'qorechain-diana'

function signatureFor(value: string) {
  return createHmac('sha256', process.env.SUPABASE_JWT_SECRET!).update(value).digest('base64url')
}

function readChallenge(value: string | undefined) {
  if (!value) return null
  const [payload, providedSignature] = value.split('.')
  if (!payload || !providedSignature) return null
  const expectedSignature = signatureFor(payload)
  const provided = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId: string
      nonce: string
      message: string
      expiresAt: number
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })

  const challenge = readChallenge(request.cookies.get(cookieName)?.value)
  if (!challenge || challenge.userId !== user.id || challenge.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Your wallet challenge expired. Please try again.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const consumedAt = new Date().toISOString()
  const { data: storedChallenge, error: consumeError } = await admin
    .from('wallet_link_challenges')
    .update({ consumed_at: consumedAt })
    .eq('nonce', challenge.nonce)
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .gt('expires_at', consumedAt)
    .select('message')
    .maybeSingle()

  if (consumeError || !storedChallenge || storedChallenge.message !== challenge.message) {
    return NextResponse.json({ error: 'Your wallet challenge expired or was already used. Please try again.' }, { status: 400 })
  }

  let input: { signature?: SiwqSignature; displayName?: string; handle?: string }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const displayName = input.displayName?.trim()
  const handle = input.handle?.trim().toLowerCase()
  if (!displayName || displayName.length > 80 || !handle || !/^[a-z0-9_]{3,24}$/.test(handle)) {
    return NextResponse.json({ error: 'Enter a name (1–80 characters) and a handle (3–24 letters, numbers, or underscores).' }, { status: 400 })
  }
  if (!input.signature || input.signature.signatureType !== 'secp256k1') {
    return NextResponse.json({ error: 'The wallet returned an unsupported signature.' }, { status: 400 })
  }

  try {
    const fields = verifySiwq({
      message: challenge.message,
      signature: input.signature,
      domain: request.nextUrl.host,
      nonce: challenge.nonce,
      chainId,
      requirePq: false,
    })
    if (fields.requestId !== user.id) {
      return NextResponse.json({ error: 'The signature does not match this account challenge.' }, { status: 400 })
    }

    const { error } = await admin.from('profiles').upsert({
      id: user.id,
      wallet_address: fields.address,
      handle,
      display_name: displayName,
    }, { onConflict: 'id' })
    if (error) {
      const message = error.code === '23505'
        ? 'That handle or wallet is already linked to another account.'
        : 'Could not save your profile. Please try again.'
      return NextResponse.json({ error: message }, { status: 409 })
    }

    const response = NextResponse.json({ ok: true, address: fields.address })
    response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth/wallet', maxAge: 0 })
    return response
  } catch {
    return NextResponse.json({ error: 'Wallet proof could not be verified. Please reconnect and sign the new challenge.' }, { status: 400 })
  }
}
