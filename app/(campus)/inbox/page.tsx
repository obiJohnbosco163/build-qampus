import Link from 'next/link'
import { ArrowUpRight, Bell, UsersRound } from 'lucide-react'
import { respondToPostTag } from '@/app/(campus)/actions'
import { createClient } from '@/lib/supabase/server'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const [{ data: requests }, { data: tags }] = await Promise.all([
    supabase.from('circles').select('id, owner_id, label, created_at').eq('target_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(40),
    supabase.from('post_tags').select('id, tagged_by, post_id, created_at').eq('tagged_user_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(40),
  ])
  const personIds = [...new Set([...(requests ?? []).map((request) => request.owner_id), ...(tags ?? []).map((tag) => tag.tagged_by)])]
  const postIds = [...new Set((tags ?? []).map((tag) => tag.post_id))]
  const [{ data: profiles }, { data: posts }] = await Promise.all([
    personIds.length ? supabase.from('profiles').select('id, handle, display_name').in('id', personIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from('posts').select('id, title').in('id', postIds) : Promise.resolve({ data: [] }),
  ])
  const people = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const postTitles = new Map((posts ?? []).map((post) => [post.id, post.title]))

  return (
    <div className="platform-page inbox-page">
      <div className="platform-page-heading"><div><p className="section-label">[ 04 / INBOX ]</p><h1>Good things need a yes.</h1><p>Requests that need your attention, gathered in one place.</p></div><Bell size={21} className="inbox-heading-icon" /></div>
      <section className="inbox-list" aria-labelledby="inbox-tags-title">
        <div className="circle-list-heading"><h2 id="inbox-tags-title">Post tags</h2><span>{tags?.length ?? 0}</span></div>
        {(tags ?? []).map((tag) => {
          const person = people.get(tag.tagged_by)
          return <article className="inbox-request" key={tag.id}><div className="circle-person-avatar" aria-hidden="true">{person?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') ?? 'Q'}</div><div className="circle-person-copy"><strong>{person?.display_name ?? 'Qampus member'} tagged you</strong><span>@{person?.handle ?? 'member'} · {postTitles.get(tag.post_id) ?? 'a milestone'}</span><time dateTime={tag.created_at}>{new Date(tag.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</time></div><div className="inbox-request-actions"><form action={respondToPostTag}><input type="hidden" name="tag_id" value={tag.id} /><input type="hidden" name="status" value="accepted" /><button className="platform-outline-button" type="submit">Accept</button></form><form action={respondToPostTag}><input type="hidden" name="tag_id" value={tag.id} /><input type="hidden" name="status" value="hidden" /><button className="platform-outline-button" type="submit">Hide</button></form></div></article>
        })}
        {!tags?.length && <p className="inbox-empty">No post tags need your attention.</p>}
      </section>
      <section className="inbox-list" aria-labelledby="inbox-requests-title">
        <div className="circle-list-heading"><h2 id="inbox-requests-title">Circle requests</h2><span>{requests?.length ?? 0}</span></div>
        {(requests ?? []).map((request: { id: string; owner_id: string; label: string; created_at: string }) => {
          const person = people.get(request.owner_id)
          return <article className="inbox-request" key={request.id}><div className="circle-person-avatar" aria-hidden="true">{person?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') ?? 'Q'}</div><div className="circle-person-copy"><strong>{person?.display_name ?? 'Qampus member'}</strong><span>@{person?.handle ?? 'member'} · wants to label you <b>{request.label}</b></span><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</time></div><Link href="/circles" className="platform-outline-button">Review <ArrowUpRight size={13} /></Link></article>
        })}
        {!requests?.length && <div className="inbox-empty"><UsersRound size={22} /><h2>Nothing waiting on you.</h2><p>When someone invites you into a Circle, you can accept or decline it here.</p></div>}
      </section>
    </div>
  )
}
