import Link from 'next/link'
import { ArrowUpRight, Bell, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: requests } = await supabase.from('circles').select('id, owner_id, label, created_at').eq('target_id', user!.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(40)
  const ownerIds = [...new Set((requests ?? []).map((request: { owner_id: string }) => request.owner_id))]
  const { data: profiles } = ownerIds.length ? await supabase.from('profiles').select('id, handle, display_name').in('id', ownerIds) : { data: [] }
  const people = new Map((profiles ?? []).map((profile: { id: string; handle: string; display_name: string }) => [profile.id, profile]))

  return (
    <div className="platform-page inbox-page">
      <div className="platform-page-heading"><div><p className="section-label">[ 04 / INBOX ]</p><h1>Good things need a yes.</h1><p>Requests that need your attention, gathered in one place.</p></div><Bell size={21} className="inbox-heading-icon" /></div>
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
