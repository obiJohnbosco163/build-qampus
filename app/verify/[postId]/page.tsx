import Link from 'next/link'
import { notFound } from 'next/navigation'
import { decodeEventLog } from 'viem'
import { ArrowLeft, Check, CircleAlert, Fingerprint, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { qorechainPublicClient, registryAddress } from '@/lib/qorechain/evm'
import { milestoneFingerprint } from '@/lib/qorechain/fingerprint'
import { milestoneTypeCode, registryAbi, type MilestoneFingerprintInput } from '@/lib/qorechain/registry'
import { qorToEvm } from '@qorechain/sdk'
import { VerifierExplainer } from '@/components/qampus/verifier-explainer'

export default async function VerifyPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(postId)) notFound()
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('id, author_id, milestone_type, title, summary, story, visibility').eq('id', postId).maybeSingle()
  if (!post) notFound()

  const [{ data: anchor }, { data: profile }] = await Promise.all([
    supabase.from('post_anchors').select('content_hash, tx_hash, chain_id, contract_address, block_number, anchored_at').eq('post_id', postId).maybeSingle(),
    supabase.from('profiles').select('handle, display_name, wallet_address').eq('id', post.author_id).maybeSingle(),
  ])

  let chainStatus: 'verified' | 'mismatch' | 'unavailable' | 'not-anchored' = 'not-anchored'
  if (anchor && profile) {
    const address = registryAddress()
    if (!address) {
      chainStatus = 'unavailable'
    } else {
      try {
        const fingerprint = milestoneFingerprint(post as MilestoneFingerprintInput)
        const authorAddress = qorToEvm(profile.wallet_address) as `0x${string}`
        const [exists, milestoneType, anchoredAt, blockNumber] = await qorechainPublicClient.readContract({
          address,
          abi: registryAbi,
          functionName: 'getAnchor',
          args: [authorAddress, fingerprint],
        })
        const receipt = await qorechainPublicClient.getTransactionReceipt({ hash: anchor.tx_hash as `0x${string}` })
        let eventMatches = false
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== address.toLowerCase()) continue
          try {
            const { args } = decodeEventLog({
              abi: registryAbi,
              eventName: 'AnchorCreated',
              data: log.data,
              topics: log.topics,
            })
            eventMatches = args.student.toLowerCase() === authorAddress.toLowerCase()
              && args.contentHash.toLowerCase() === fingerprint.toLowerCase()
              && Number(args.milestoneType) === milestoneTypeCode(post.milestone_type)
            if (eventMatches) break
          } catch {
            continue
          }
        }
        const indexedFingerprintMatches = anchor.content_hash.toLowerCase() === fingerprint.toLowerCase()
        const indexedBlockMatches = anchor.block_number === blockNumber.toString() && receipt.blockNumber === blockNumber
        const indexedTimeMatches = Math.floor(Date.parse(anchor.anchored_at) / 1000) === Number(anchoredAt)
        const indexedContractMatches = anchor.contract_address.toLowerCase() === address.toLowerCase() && anchor.chain_id === 'qorechain-diana'
        chainStatus = exists && receipt.status === 'success' && receipt.to?.toLowerCase() === address.toLowerCase() && eventMatches && indexedFingerprintMatches && indexedBlockMatches && indexedTimeMatches && indexedContractMatches
          ? 'verified'
          : 'mismatch'
      } catch {
        chainStatus = 'unavailable'
      }
    }
  }

  return (
    <main className="verify-page">
      <header className="verify-header"><Link href="/" className="qampus-brand"><span className="qampus-brand-mark"><Fingerprint size={18} /></span><span>qampus<span className="brand-period">.</span></span></Link><span className="verify-network"><span className="status-dot" /> QORECHAIN DIANA</span></header>
      <div className="verify-content">
        <Link href={`/p/${post.id}`} className="platform-back-link"><ArrowLeft size={15} /> Back to milestone</Link>
        <p className="section-label">[ PUBLIC VERIFICATION / 01 ]</p>
        <h1>Proof, not promises.</h1>
        <p className="verify-intro">This page compares the published milestone with its indexed QoreChain record. The story itself stays off-chain.</p>
        <section className={`verify-result verify-result-${chainStatus}`} aria-live="polite">
          <div className="verify-result-icon">{chainStatus === 'verified' ? <Check size={19} /> : chainStatus === 'mismatch' ? <CircleAlert size={19} /> : <Fingerprint size={19} />}</div>
          <div><span className="verify-result-eyebrow">{chainStatus === 'verified' ? 'CHAIN RECORD MATCHES' : chainStatus === 'mismatch' ? 'RECORD DOES NOT MATCH' : chainStatus === 'unavailable' ? 'VERIFICATION TEMPORARILY UNAVAILABLE' : 'NO ANCHOR FOUND'}</span><h2>{chainStatus === 'verified' ? 'Milestone verified' : chainStatus === 'mismatch' ? 'Verification failed' : chainStatus === 'unavailable' ? 'Could not reach the registry' : 'This milestone is not anchored'}</h2><p>{chainStatus === 'verified' ? 'The content fingerprint, author wallet, transaction event, and indexed block all match the contract record.' : chainStatus === 'mismatch' ? 'The indexed record or current milestone content differs from the contract. Do not treat this as verified.' : chainStatus === 'unavailable' ? 'The public chain or contract configuration could not be reached. Try again later.' : 'The author has not published an on-chain proof for this milestone.'}</p></div>
        </section>
        {anchor ? <VerifierExplainer postId={post.id} /> : null}
        <section className="verify-details"><div className="verify-detail-heading"><div><p className="section-label">[ MILESTONE ]</p><h2>{post.title || 'Untitled milestone'}</h2></div>{chainStatus === 'verified' ? <span className="verify-stamp"><ShieldCheck size={14} /> VERIFIED</span> : null}</div><p className="verify-author">By {profile?.display_name ?? 'Qampus member'}{profile?.handle ? ` · @${profile.handle}` : ''}</p><div className="verify-data-grid"><div><span>CONTENT FINGERPRINT</span><code>{anchor?.content_hash ?? 'Not available'}</code></div><div><span>TRANSACTION HASH</span><code>{anchor?.tx_hash ?? 'Not available'}</code></div><div><span>CONTRACT</span><code>{anchor?.contract_address ?? registryAddress() ?? 'Not configured'}</code></div><div><span>BLOCK</span><code>{anchor?.block_number ?? 'Not available'}</code></div><div><span>INDEXED AT</span><code>{anchor ? new Date(anchor.anchored_at).toLocaleString() : 'Not available'}</code></div><div><span>NETWORK</span><code>{anchor?.chain_id ?? 'qorechain-diana'}</code></div></div>{post.story && <div className="verify-content-check"><span>CONTENT CHECK</span><code>{milestoneFingerprint(post as MilestoneFingerprintInput)}</code></div>}</section>
      </div>
    </main>
  )
}
