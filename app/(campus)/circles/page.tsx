import { createClient } from '@/lib/supabase/server'
import { createCircleRequest, respondToCircle } from '../actions'

const labels = ['Course rep', 'Course mate', 'Level mate', 'Class set mate', 'Lab partner', 'Project partner', 'Supervisor', 'Lecturer', 'Departmental president', 'Faculty president', 'Student union leader', 'Community lead', 'Mentor', 'Mentee', 'Hackathon teammate', 'Tech bro', 'Tech sis', 'Dev bro', 'Dev sis', 'Best friend', 'Roommate', 'Gist partner']

type Circle = { id: string; owner_id: string; target_id: string; label: string; status: string; created_at: string }

export default async function CirclesPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const [{ error, sent }, supabase] = await Promise.all([searchParams, createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rows } = await supabase.from('circles').select('id, owner_id, target_id, label, status, created_at').or(`owner_id.eq.${user!.id},target_id.eq.${user!.id}`).order('created_at', { ascending: false }).limit(80)
  const circles = (rows ?? []) as Circle[]
  const otherIds = [...new Set(circles.map((circle) => circle.owner_id === user!.id ? circle.target_id : circle.owner_id))]
  const { data: profiles } = otherIds.length ? await supabase.from('profiles').select('id, handle, display_name, institution').in('id', otherIds) : { data: [] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (
    <div className="platform-page circles-page">
      <div className="platform-page-heading"><div><p className="section-label">[ 03 / CONSENTED RELATIONSHIPS ]</p><h1>People make the story.</h1><p>Labels stay private until both sides accept. Either person can remove a connection later.</p></div></div>
      <section className="circle-request-panel"><div><span className="circle-request-icon">+</span><div><h2>Send a Circle request</h2><p>Choose a campus role and invite someone by their Qampus handle.</p></div></div><form action={createCircleRequest} className="circle-request-form"><label className="sr-only" htmlFor="circle-handle">Qampus handle</label><input className="platform-input" id="circle-handle" name="handle" placeholder="@campus_handle" maxLength={25} required /><label className="sr-only" htmlFor="circle-label">Relationship label</label><select className="platform-input" id="circle-label" name="label" defaultValue="Course mate">{labels.map((label) => <option key={label}>{label}</option>)}</select><button className="button-primary" type="submit">Send request</button></form>{sent && <p className="circle-feedback" role="status">Request sent. The label will only activate if they accept.</p>}{error && <p className="auth-error" role="alert">{error === 'not-found' ? 'That handle was not found (or belongs to your account).' : error === 'exists' ? 'A Circle request already exists for that person.' : 'Could not send the request. Check the handle and try again.'}</p>}</section>
      <div className="circle-lists">
        <section><div className="circle-list-heading"><h2>Incoming</h2><span>{circles.filter((circle) => circle.target_id === user!.id && circle.status === 'pending').length}</span></div>
          {circles.filter((circle) => circle.target_id === user!.id && circle.status === 'pending').map((circle) => { const person = profileById.get(circle.owner_id); return <article className="circle-row" key={circle.id}><div className="circle-person-avatar" aria-hidden="true">{person?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') ?? 'Q'}</div><div className="circle-person-copy"><strong>{person?.display_name ?? 'Qampus member'}</strong><span>@{person?.handle ?? 'member'} · wants to label you <b>{circle.label}</b></span></div><div className="circle-row-actions"><form action={respondToCircle}><input type="hidden" name="id" value={circle.id} /><input type="hidden" name="status" value="accepted" /><button className="circle-accept" type="submit">Accept</button></form><form action={respondToCircle}><input type="hidden" name="id" value={circle.id} /><input type="hidden" name="status" value="declined" /><button className="circle-decline" type="submit">Decline</button></form></div></article> })}
          {!circles.some((circle) => circle.target_id === user!.id && circle.status === 'pending') && <p className="circle-list-empty">No incoming requests. Your Circles stay yours to choose.</p>}
        </section>
        <section><div className="circle-list-heading"><h2>Accepted Circles</h2><span>{circles.filter((circle) => circle.status === 'accepted').length}</span></div>
          {circles.filter((circle) => circle.status === 'accepted').map((circle) => { const person = profileById.get(circle.owner_id === user!.id ? circle.target_id : circle.owner_id); return <article className="circle-row" key={circle.id}><div className="circle-person-avatar" aria-hidden="true">{person?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') ?? 'Q'}</div><div className="circle-person-copy"><strong>{person?.display_name ?? 'Qampus member'}</strong><span>@{person?.handle ?? 'member'} · <b>{circle.label}</b></span></div><span className="circle-status-accepted">ACTIVE</span></article> })}
          {!circles.some((circle) => circle.status === 'accepted') && <p className="circle-list-empty">Accepted labels will appear here. The relationship becomes active only with consent.</p>}
        </section>
        <section><div className="circle-list-heading"><h2>Sent requests</h2><span>{circles.filter((circle) => circle.owner_id === user!.id && circle.status === 'pending').length}</span></div>
          {circles.filter((circle) => circle.owner_id === user!.id && circle.status === 'pending').map((circle) => { const person = profileById.get(circle.target_id); return <article className="circle-row" key={circle.id}><div className="circle-person-avatar" aria-hidden="true">{person?.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') ?? 'Q'}</div><div className="circle-person-copy"><strong>{person?.display_name ?? 'Qampus member'}</strong><span>@{person?.handle ?? 'member'} · requested <b>{circle.label}</b></span></div><span className="circle-status-pending">AWAITING</span></article> })}
          {!circles.some((circle) => circle.owner_id === user!.id && circle.status === 'pending') && <p className="circle-list-empty">Requests you send will appear here.</p>}
        </section>
      </div>
    </div>
  )
}
