import Link from 'next/link'
import {
  ArrowUpRight,
  Bell,
  Compass,
  Fingerprint,
  Home,
  Orbit,
  Plus,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

type Profile = {
  handle: string
  display_name: string
  institution: string | null
  department: string | null
}

const links = [
  { href: '/feed', label: 'Campus feed', icon: Home },
  { href: '/circles', label: 'My Circles', icon: UsersRound },
  { href: '/inbox', label: 'Inbox', icon: Bell },
]

export function PlatformShell({ profile, children, isModerator = false }: { profile: Profile; children: React.ReactNode; isModerator?: boolean }) {
  const initials = profile.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="platform-shell">
      <aside className="platform-sidebar">
        <Link className="qampus-brand platform-brand" href="/feed" aria-label="Qampus home">
          <span className="qampus-brand-mark"><Orbit size={19} strokeWidth={1.8} /></span>
          <span>qampus<span className="brand-period">.</span></span>
        </Link>
        <div className="platform-campus-label"><span className="status-dot" /> CAMPUS NETWORK</div>
        <nav className="platform-nav" aria-label="Workspace navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}><Icon size={17} aria-hidden="true" /><span>{label}</span></Link>
          ))}
          <Link href={`/u/${encodeURIComponent(profile.handle)}`}><Fingerprint size={17} aria-hidden="true" /><span>My passport</span></Link>
          {isModerator && <Link href="/moderation"><ShieldCheck size={17} aria-hidden="true" /><span>Moderation</span></Link>}
        </nav>
        <Link href="/post/new" className="platform-compose"><Plus size={17} aria-hidden="true" /> Share a milestone</Link>
        <div className="platform-sidebar-bottom">
          <div className="platform-user-avatar" aria-hidden="true">{initials}</div>
          <div className="platform-user-copy"><strong>{profile.display_name}</strong><span>@{profile.handle}</span></div>
          <Link href="/settings" className="platform-user-link" aria-label="Account settings"><ArrowUpRight size={15} /></Link>
        </div>
      </aside>
      <div className="platform-main">
        <header className="platform-topbar">
          <Link className="platform-mobile-brand" href="/feed"><Orbit size={18} /> qampus<span>.</span></Link>
          <div className="platform-topbar-note"><span className="status-dot" /> YOUR CAMPUS. YOUR STORY.</div>
          <Link className="platform-avatar-small" href={`/u/${encodeURIComponent(profile.handle)}`} aria-label="View your passport">{initials}</Link>
        </header>
        <main className="platform-content">{children}</main>
        <nav className="platform-mobile-nav" aria-label="Mobile navigation">
          <Link href="/feed"><Home size={18} /><span>Feed</span></Link>
          <Link href="/circles"><UsersRound size={18} /><span>Circles</span></Link>
          <Link className="mobile-create" href="/post/new" aria-label="Create milestone"><Plus size={20} /></Link>
          <Link href="/inbox"><Bell size={18} /><span>Inbox</span></Link>
          <Link href={`/u/${encodeURIComponent(profile.handle)}`}><Compass size={18} /><span>Passport</span></Link>
          {isModerator && <Link href="/moderation"><ShieldCheck size={18} /><span>Review</span></Link>}
        </nav>
      </div>
    </div>
  )
}
