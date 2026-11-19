import Link from 'next/link'
import { ArrowUpRight, Fingerprint, LogOut, ShieldCheck } from 'lucide-react'
import { signOut } from '../actions'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('handle, display_name, wallet_address, institution, department').eq('id', user!.id).maybeSingle()

  return (
    <div className="platform-page settings-page">
      <div className="platform-page-heading"><div><p className="section-label">[ 05 / ACCOUNT & PRIVACY ]</p><h1>Your account, your call.</h1><p>Review what Qampus knows and what is public on your Passport.</p></div></div>
      <section className="settings-card"><div className="settings-card-heading"><div className="settings-icon"><Fingerprint size={17} /></div><div><h2>Qampus identity</h2><p>Your handle is part of your public Passport address.</p></div></div><dl className="settings-facts"><div><dt>DISPLAY NAME</dt><dd>{profile?.display_name}</dd></div><div><dt>HANDLE</dt><dd>@{profile?.handle}</dd></div><div><dt>INSTITUTION</dt><dd>{profile?.institution || 'Not added'}</dd></div><div><dt>DEPARTMENT</dt><dd>{profile?.department || 'Not added'}</dd></div><div><dt>LINKED QOREX WALLET</dt><dd><code>{profile?.wallet_address}</code></dd></div></dl><Link href={`/u/${encodeURIComponent(profile?.handle ?? '')}`} className="settings-link">View public Passport <ArrowUpRight size={14} /></Link></section>
      <section className="settings-card settings-privacy-card"><div className="settings-card-heading"><div className="settings-icon settings-icon-green"><ShieldCheck size={17} /></div><div><h2>Privacy and proof</h2><p>Posting and anchoring are separate choices.</p></div></div><ul><li>Only milestones marked Public appear on public Passports.</li><li>Anchoring writes a content fingerprint, not your post text or files.</li><li>Circle labels stay hidden until both people accept.</li><li>Sealed sharing is not enabled until recipient encryption is ready.</li></ul></section>
      <form action={signOut} className="settings-signout"><button type="submit"><LogOut size={15} /> Sign out</button></form>
    </div>
  )
}
