import { decodeEventLog, type Hex } from 'viem'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { qorechainPublicClient, registryAddress } from '@/lib/qorechain/evm'
import { milestoneFingerprint } from '@/lib/qorechain/fingerprint'
import { milestoneTypeCode, registryAbi, type MilestoneFingerprintInput } from '@/lib/qorechain/registry'
import { qorToEvm } from '@qorechain/sdk'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 2048) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })

  const address = registryAddress()
  if (!address) return NextResponse.json({ error: 'The Qampus Registry contract is not configured.' }, { status: 503 })

  let input: { postId?: string; txHash?: string }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!input.postId || !/^[0-9a-f-]{36}$/i.test(input.postId) || !input.txHash || !/^0x[0-9a-f]{64}$/i.test(input.txHash)) {
    return NextResponse.json({ error: 'Provide a valid milestone and transaction hash.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, milestone_type, title, summary, story, visibility')
    .eq('id', input.postId)
    .maybeSingle()
  if (!post || post.author_id !== user.id) return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 })
  if (post.visibility === 'sealed' || !post.story) return NextResponse.json({ error: 'This milestone cannot be anchored in its current form.' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('wallet_address').eq('id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'A linked QoreX wallet is required.' }, { status: 403 })
  const expectedAuthor = qorToEvm(profile.wallet_address).toLowerCase()
  const fingerprint = milestoneFingerprint(post as MilestoneFingerprintInput)
  const milestoneCode = milestoneTypeCode(post.milestone_type)
  if (milestoneCode < 0) return NextResponse.json({ error: 'Unsupported milestone type.' }, { status: 400 })

  const { data: existing } = await supabase.from('post_anchors').select('id').eq('post_id', post.id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'This milestone already has an indexed anchor.' }, { status: 409 })

  let receipt
  try {
    receipt = await qorechainPublicClient.getTransactionReceipt({ hash: input.txHash as Hex })
  } catch {
    return NextResponse.json({ error: 'The transaction is not confirmed on QoreChain Diana.' }, { status: 202 })
  }
  if (receipt.status !== 'success' || receipt.to?.toLowerCase() !== address.toLowerCase()) {
    return NextResponse.json({ error: 'The transaction failed or was sent to another contract.' }, { status: 400 })
  }

  type AnchorCreatedArgs = { student: `0x${string}`; contentHash: `0x${string}`; milestoneType: number; anchoredAt: bigint }
  let verifiedEvent: AnchorCreatedArgs | null = null
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== address.toLowerCase()) continue
    try {
      const decoded = decodeEventLog({ abi: registryAbi, eventName: 'AnchorCreated', data: log.data, topics: log.topics })
      verifiedEvent = decoded.args as AnchorCreatedArgs
      if (verifiedEvent) break
    } catch {
      continue
    }
  }

  if (
    !verifiedEvent ||
    verifiedEvent.student.toLowerCase() !== expectedAuthor ||
    verifiedEvent.contentHash.toLowerCase() !== fingerprint.toLowerCase() ||
    Number(verifiedEvent.milestoneType) !== milestoneCode
  ) {
    return NextResponse.json({ error: 'The transaction does not prove this milestone and linked wallet.' }, { status: 400 })
  }

  const anchoredAt = new Date(Number(verifiedEvent.anchoredAt) * 1000).toISOString()
  const admin = createAdminClient()
  const { error } = await admin.from('post_anchors').insert({
    post_id: post.id,
    content_hash: fingerprint,
    tx_hash: receipt.transactionHash,
    chain_id: 'qorechain-diana',
    contract_address: address,
    block_number: receipt.blockNumber.toString(),
    anchored_at: anchoredAt,
  })
  if (error) {
    return NextResponse.json({ error: error.code === '23505' ? 'This transaction is already indexed.' : 'The verified anchor could not be indexed.' }, { status: error.code === '23505' ? 409 : 503 })
  }

  return NextResponse.json({ ok: true, contentHash: fingerprint, txHash: receipt.transactionHash }, { headers: { 'Cache-Control': 'no-store' } })
}
