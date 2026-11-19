import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Orbit } from 'lucide-react'
import { WalletOnboarding } from '@/components/qampus/wallet-onboarding'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (profile) redirect('/')

  return (
    <main className="qampus-shell auth-shell">
      <div className="qampus-grid-glow" aria-hidden="true" />
      <header className="qampus-header auth-header">
        <Link className="qampus-brand" href="/" aria-label="Qampus home">
          <span className="qampus-brand-mark"><Orbit size={19} strokeWidth={1.8} /></span>
          <span>qampus<span className="brand-period">.</span></span>
        </Link>
        <span className="auth-header-note">STEP 2 / 2</span>
      </header>
      <section className="auth-card" aria-labelledby="onboarding-title">
        <p className="section-label">[ WALLET VERIFICATION ]</p>
        <h1 id="onboarding-title">Make it yours.</h1>
        <p className="auth-intro">Your email account is ready. Link a QoreX wallet to establish your Qampus identity and create your profile.</p>
        <p className="auth-account">Signed in as <strong>{user.email}</strong></p>
        <WalletOnboarding />
      </section>
    </main>
  )
}
