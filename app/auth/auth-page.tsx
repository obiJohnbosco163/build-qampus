import Link from 'next/link'
import { Orbit } from 'lucide-react'
import { AuthForm } from '@/components/qampus/auth-form'

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const signingUp = mode === 'sign-up'
  return (
    <main className="qampus-shell auth-shell">
      <div className="qampus-grid-glow" aria-hidden="true" />
      <header className="qampus-header auth-header">
        <Link className="qampus-brand" href="/" aria-label="Qampus home">
          <span className="qampus-brand-mark"><Orbit size={19} strokeWidth={1.8} /></span>
          <span>qampus<span className="brand-period">.</span></span>
        </Link>
        <span className="auth-header-note">YOUR STORY, YOURS TO KEEP</span>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="section-label">[ EMAIL + QOREX WALLET ]</p>
        <h1 id="auth-title">{signingUp ? 'Start your Qampus story.' : 'Welcome back.'}</h1>
        <p className="auth-intro">
          {signingUp
            ? 'Create an account with your email, then link your QoreX wallet with a signed proof.'
            : 'Sign in with your email and password. Your linked QoreX wallet stays part of your profile.'}
        </p>
        <AuthForm mode={mode} />
        <p className="auth-privacy">Your wallet is linked only after you approve a one-time signature challenge.</p>
      </section>
    </main>
  )
}
