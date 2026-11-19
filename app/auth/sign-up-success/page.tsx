import Link from 'next/link'
import { Orbit } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <main className="qampus-shell auth-shell">
      <div className="qampus-grid-glow" aria-hidden="true" />
      <header className="qampus-header auth-header">
        <Link className="qampus-brand" href="/" aria-label="Qampus home">
          <span className="qampus-brand-mark"><Orbit size={19} strokeWidth={1.8} /></span>
          <span>qampus<span className="brand-period">.</span></span>
        </Link>
      </header>
      <section className="auth-card" aria-labelledby="success-title">
        <p className="section-label">[ CHECK YOUR INBOX ]</p>
        <h1 id="success-title">Confirm your email.</h1>
        <p className="auth-intro">We sent a confirmation link to your email address. Open it to continue, then connect your QoreX wallet to finish setting up your profile.</p>
        <Link className="button-primary auth-submit auth-link-button" href="/auth/sign-in">Go to sign in</Link>
      </section>
    </main>
  )
}
