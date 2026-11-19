import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Fingerprint, ShieldCheck } from 'lucide-react'
import { PublicHeader } from '@/components/qampus/public-header'
import { createClient } from '@/lib/supabase/server'

const labels: Record<string, string> = { siwes: 'SIWES', project: 'PROJECT', internal_defence: 'INTERNAL DEFENCE', external_defence: 'EXTERNAL DEFENCE', experience: 'EXPERIENCE', general: 'MILESTONE' }

export default async function PassportPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const normalizedHandle = handle.toLowerCase()
  const supabase = await createClient()
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('id, handle, display_name, institution, department, level').eq('handle', normalizedHandle).maybeSingle(),
  ])
  if (!profile) notFound()
  const { data: posts } = await supabase.from('posts').select('id, milestone_type, title, summary, visibility, created_at').eq('author_id', profile.id).eq('visibility', 'public').order('created_at', { ascending: false }).limit(50)
  const postIds = (posts ?? []).map((post) => post.id)
  const { data: anchors } = postIds.length ? await supabase.from('post_anchors').select('post_id, content_hash, tx_hash, anchored_at').in('post_id', postIds) : { data: [] }
  const anchorIds = new Set((anchors ?? []).map((anchor) => anchor.post_id))
  const initials = profile.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('')

  return (
    <main className="public-route-shell">
      <PublicHeader signedIn={Boolean(user)} />
      <div className="platform-page passport-page public-passport-page">
      <section className="passport-profile-card">
        <div className="passport-profile-top"><div className="passport-profile-avatar" aria-hidden="true">{initials}</div><div className="passport-profile-identity"><p className="section-label">[ QAMPUS / PASSPORT ]</p><h1>{profile.display_name}</h1><span>@{profile.handle}</span></div><span className="passport-proof-label"><ShieldCheck size={15} /> STUDENT RECORD</span></div>
        <div className="passport-profile-facts"><div><span>INSTITUTION</span><strong>{profile.institution || 'Not added'}</strong></div><div><span>DEPARTMENT</span><strong>{profile.department || 'Not added'}</strong></div><div><span>LEVEL</span><strong>{profile.level || 'Not added'}</strong></div></div>
        <div className="passport-profile-foot"><span><Fingerprint size={14} /> {posts?.length ?? 0} milestones · {anchorIds.size} anchored</span><span className="passport-share-button">PASSPORT /u/{profile.handle}</span></div>
      </section>
      <div className="passport-timeline-heading"><div><p className="section-label">[ THE WORK, OVER TIME ]</p><h2>Milestone timeline</h2></div>{user?.id === profile.id && <Link href="/post/new" className="platform-outline-button"><Fingerprint size={15} /> Add milestone</Link>}</div>
      <div className="passport-timeline">
        {(posts ?? []).map((post) => <article className="passport-milestone" key={post.id}><div className="timeline-mark"><span className={anchorIds.has(post.id) ? 'timeline-mark-dot timeline-mark-anchored' : 'timeline-mark-dot'} /></div><div className="passport-milestone-content"><div className="passport-milestone-meta"><span>{labels[post.milestone_type] ?? 'MILESTONE'}</span><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('en', { year: 'numeric', month: 'short' })}</time></div><Link href={`/p/${post.id}`} className="passport-milestone-title">{post.title || 'Untitled milestone'} <ArrowUpRight size={14} /></Link><p>{post.summary || 'A story of work and growth.'}</p><span className={anchorIds.has(post.id) ? 'milestone-trust milestone-trust-live' : 'milestone-trust'}>{anchorIds.has(post.id) ? <ShieldCheck size={13} /> : <Fingerprint size={13} />}{anchorIds.has(post.id) ? 'CHAIN RECORD ADDED' : 'STORY ON QAMPUS'}</span></div></article>)}
      </div>
      {!posts?.length && <div className="feed-empty passport-empty"><div className="empty-orbit"><Fingerprint size={24} /></div><h2>The next chapter is unwritten.</h2><p>Public milestones will appear here.</p></div>}
      </div>
    </main>
  )
}
