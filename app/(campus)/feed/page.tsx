import Link from 'next/link'
import { ArrowUpRight, Fingerprint, Plus, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const milestoneLabels: Record<string, string> = {
  siwes: 'SIWES', project: 'PROJECT', internal_defence: 'INTERNAL DEFENCE',
  external_defence: 'EXTERNAL DEFENCE', experience: 'EXPERIENCE', general: 'MILESTONE',
}

type Post = {
  id: string
  author_id: string
  milestone_type: string
  title: string | null
  summary: string | null
  story: string | null
  visibility: string
  created_at: string
}

export default async function FeedPage() {
  const supabase = await createClient()
  const [{ data: posts }, { data: viewer }] = await Promise.all([
    supabase.from('posts').select('id, author_id, milestone_type, title, summary, story, visibility, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.auth.getUser(),
  ])
  const items = (posts ?? []) as Post[]
  const authorIds = [...new Set(items.map((post) => post.author_id))]
  const postIds = items.map((post) => post.id)
  const [{ data: authors }, { data: anchors }] = await Promise.all([
    authorIds.length ? supabase.from('profiles').select('id, handle, display_name, institution, department').in('id', authorIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from('post_anchors').select('post_id, tx_hash, content_hash, anchored_at').in('post_id', postIds) : Promise.resolve({ data: [] }),
  ])
  const profilesById = new Map((authors ?? []).map((author: { id: string; handle: string; display_name: string; institution: string | null; department: string | null }) => [author.id, author]))
  const anchorsByPost = new Map((anchors ?? []).map((anchor: { post_id: string; tx_hash: string; content_hash: string; anchored_at: string }) => [anchor.post_id, anchor]))

  return (
    <div className="platform-page">
      <div className="platform-page-heading">
        <div><p className="section-label">[ 01 / CAMPUS NETWORK ]</p><h1>Your campus, in progress.</h1><p>Milestones from people building, learning, and showing up around you.</p></div>
        <Link className="platform-outline-button" href="/post/new"><Plus size={16} /> Share a milestone</Link>
      </div>
      <div className="feed-filter-bar"><span className="feed-filter-active">Campus</span><span>Latest</span><span className="feed-filter-note">VISIBLE TO SIGNED-IN MEMBERS</span></div>
      <div className="feed-list">
        {items.map((post) => {
          const author = profilesById.get(post.author_id)
          const anchor = anchorsByPost.get(post.id)
          const initials = (author?.display_name ?? 'Qampus member').split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase() ?? '').join('')
          return (
            <article className="feed-card" key={post.id}>
              <div className="feed-card-top">
                <div className="feed-author-avatar" aria-hidden="true">{initials}</div>
                <div className="feed-author-copy">
                  <Link href={author ? `/u/${encodeURIComponent(author.handle)}` : '/feed'}>{author?.display_name ?? 'Qampus member'}</Link>
                  <span>{author?.institution || 'Campus'}{author?.department ? ` · ${author.department}` : ''} · {new Date(post.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
                <span className="feed-type-chip">{milestoneLabels[post.milestone_type] ?? 'MILESTONE'}</span>
              </div>
              <Link href={`/p/${post.id}`} className="feed-post-link">
                <h2>{post.title || 'Untitled milestone'}</h2>
                <p>{post.summary || post.story?.slice(0, 220) || 'A new milestone shared on Qampus.'}</p>
              </Link>
              <div className="feed-card-bottom">
                <span className="feed-visibility"><span className="visibility-dot" /> {post.visibility === 'public' ? 'PUBLIC' : 'CAMPUS'}</span>
                {anchor ? <span className="feed-anchor-badge"><ShieldCheck size={14} /> ANCHORED</span> : <span className="feed-unanchored"><Fingerprint size={14} /> NOT ANCHORED</span>}
                <Link className="feed-open-link" href={`/p/${post.id}`} aria-label={`Open ${post.title ?? 'milestone'}`}><ArrowUpRight size={17} /></Link>
              </div>
            </article>
          )
        })}
      </div>
      {items.length === 0 && <div className="feed-empty"><div className="empty-orbit"><Fingerprint size={24} /></div><h2>Your feed is ready for its first story.</h2><p>Share a project, a hard-won lesson, or the people who helped you get there.</p><Link href="/post/new" className="button-primary">Publish your first milestone <Plus size={15} /></Link></div>}
      <aside className="feed-side-note"><span className="section-label">[ TRUST LAYER ]</span><h2>Proof, when you choose it.</h2><p>Posting is free. Anchoring is an intentional step that makes edits detectable without putting your story on-chain.</p><span><ShieldCheck size={15} /> QORECHAIN DIANA TESTNET</span></aside>
      {viewer.user && <span className="sr-only">Signed-in campus feed</span>}
    </div>
  )
}
