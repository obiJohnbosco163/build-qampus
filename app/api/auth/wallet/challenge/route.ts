import { createHmac, randomBytes } from 'node:crypto'
import { createSiwqMessage, parseAddress } from '@qorechain/qoresign'
import { QORECHAIN_MAINNET_CHAIN_ID, QORECHAIN_TESTNET_CHAIN_ID } from '@qorechain/qorex-types'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const cookieName = 'qampus_wallet_challenge'

function signChallenge(value: string) {
  return createHmac('sha256', process.env.SUPABASE_JWT_SECRET!).update(value).digest('base64url')
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })

  let input: { address?: string; chainId?: string }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (input.chainId !== QORECHAIN_MAINNET_CHAIN_ID && input.chainId !== QORECHAIN_TESTNET_CHAIN_ID) {
    return NextResponse.json({ error: 'Connect QoreX to QoreChain mainnet or Diana testnet.' }, { status: 400 })
  }
  const chainId = input.chainId

  if (!input.address || input.address.length > 64) {
    return NextResponse.json({ error: 'Connect a valid QoreChain wallet.' }, { status: 400 })
  }
  let address: string
  try {
    address = parseAddress(input.address).bech32
  } catch {
    return NextResponse.json({ error: 'Connect a valid QoreChain wallet.' }, { status: 400 })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
  const nonce = randomBytes(18).toString('hex')
  const scheme = request.nextUrl.protocol.replace(':', '')
  const domain = request.nextUrl.host
  const message = createSiwqMessage({
    domain,
    scheme,
    address,
    statement: 'Link this QoreX wallet to your Qampus account.',
    uri: `${request.nextUrl.origin}/onboarding`,
    version: '1',
    chainId,
    nonce,
    issuedAt: now.toISOString(),
    expirationTime: expiresAt.toISOString(),
    requestId: user.id,
  })
  const admin = createAdminClient()
  const { error } = await admin.from('wallet_link_challenges').insert({
    nonce,
    user_id: user.id,
    message,
    expires_at: expiresAt.toISOString(),
  })
  if (error) {
    return NextResponse.json({ error: 'Could not create a wallet challenge. Please try again.' }, { status: 503 })
  }

  const payload = Buffer.from(JSON.stringify({ userId: user.id, nonce, message, chainId, expiresAt: expiresAt.getTime() })).toString('base64url')
  const value = `${payload}.${signChallenge(payload)}`
  const response = NextResponse.json({ message, chainId })
  response.cookies.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/wallet',
    maxAge: 300,
  })
  return response
}
