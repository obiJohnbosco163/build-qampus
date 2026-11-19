import Link from 'next/link'
import { ArrowUpRight, Orbit } from 'lucide-react'

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="public-page-header">
      <Link className="qampus-brand" href="/" aria-label="Qampus home"><span className="qampus-brand-mark"><Orbit size={18} strokeWidth={1.8} /></span><span>qampus<span className="brand-period">.</span></span></Link>
      <span className="public-page-kicker"><span className="status-dot" /> YOUR CAMPUS STORY, PROVEN</span>
      <Link className="public-page-action" href={signedIn ? '/feed' : '/auth/sign-in'}>{signedIn ? 'Campus feed' : 'Sign in'} <ArrowUpRight size={14} /></Link>
    </header>
  )
}
