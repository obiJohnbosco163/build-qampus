import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostProofActions } from '@/components/qampus/post-proof-actions'
import { PublicHeader } from '@/components/qampus/public-header'
import { ArrowLeft, ArrowUpRight, Fingerprint, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const labels: Record<string, string> = { siwes: 'SIWES', project: 'Project', internal_defence: 'Internal defence', external_defence: 'External defence', experience: 'Experience', general: 'Milestone' }

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('id, author_id, milestone_type, title, summary, story, visibility, created_at').eq('id', id).maybeSingle()
  if (!post) notFound()

  const [{ data: session }, { data: author }, { data: anchor }, { data: endorsements }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('handle, display_name, wallet_address, institution, department').eq('id', post.author_id).maybeSingle(),
    supabase.from('post_anchors').select('content_hash, tx_hash, chain_id, contract_address, block_number, anchored_at').eq('post_id', post.id).maybeSingle(),
    supabase.from('endorsements').select('id, attestation_hash, tx_hash, chain_id, created_at').eq('post_id', post.id).order('created_at', { ascending: true }),
  ])

  return (
    <main className="public-route-shell">
      <PublicHeader signedIn={Boolean(session.user)} />
      <article className="platform-page post-detail-page public-post-detail">
      <Link href={session.user ? '/feed' : '/'} className="platform-back-link"><ArrowLeft size={15} /> {session.user ? 'Back to campus' : 'Qampus home'}</Link>
      <div className="post-detail-card">
        <div className="post-detail-meta"><span className="feed-type-chip">{labels[post.milestone_type] ?? 'Milestone'}</span><span className="feed-visibility"><span className="visibility-dot" /> {post.visibility === 'public' ? 'PUBLIC' : 'CAMPUS'}</span></div>
        <h1>{post.title || 'Untitled milestone'}</h1>
        {post.summary && <p className="post-detail-summary">{post.summary}</p>}
        <div className="post-detail-author">
          <div className="feed-author-avatar" aria-hidden="true">{author?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('')}</div>
          <div><Link href={author ? `/u/${encodeURIComponent(author.handle)}` : '/feed'}>{author?.display_name ?? 'Qampus member'}</Link><span>{author?.institution || 'Campus'}{author?.department ? ` · ${author.department}` : ''}</span></div>
          <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        </div>
        <div className="post-detail-story">{post.story}</div>
        <section className="proof-panel" aria-labelledby="proof-title">
          <div className="proof-panel-heading"><div className="proof-icon"><Fingerprint size={18} /></div><div><h2 id="proof-title">Verification record</h2><p>QoreChain Diana testnet</p></div><span className={anchor ? 'proof-status proof-status-live' : 'proof-status'}>{anchor ? 'ANCHORED' : 'NOT ANCHORED'}</span></div>
          {anchor ? <div className="proof-record"><div><span>CONTENT FINGERPRINT</span><code>{anchor.content_hash}</code></div><div><span>TRANSACTION</span><code>{anchor.tx_hash}</code></div><div><span>CONTRACT</span><code>{anchor.contract_address}</code></div><div><span>BLOCK</span><code>{anchor.block_number}</code></div><p><ShieldCheck size={14} /> Record indexed {new Date(anchor.anchored_at).toLocaleString()}</p><Link className="verify-record-link" href={`/verify/${post.id}`}>Verify this record <ArrowUpRight size={13} /></Link></div> : <div className="proof-empty"><p>This milestone has not been anchored. Its story stays off-chain; the author can add a cryptographic record after the registry is deployed.</p><span><Fingerprint size={14} /> No on-chain proof yet</span></div>}
          {!anchor && session.user?.id === post.author_id && author && <PostProofActions postId={post.id} walletAddress={author.wallet_address} post={{ milestone_type: post.milestone_type, title: post.title, summary: post.summary, story: post.story }} alreadyAnchored={false} />}
          {!!endorsements?.length && <div className="endorsement-list"><h3>Endorsements <span>{endorsements.length}</span></h3>{endorsements.map((item) => <div key={item.id}><span className="status-dot" /> Attestation <code>{item.attestation_hash}</code></div>)}</div>}
        </section>
      </div>
      </article>
    </main>
  )
}
