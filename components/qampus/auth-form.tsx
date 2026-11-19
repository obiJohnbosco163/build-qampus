'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const signingUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const supabase = createClient()

    try {
      if (signingUp) {
        const callbackUrl = new URL(
          '/auth/callback',
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        )
        callbackUrl.searchParams.set('next', '/onboarding')
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl.toString() },
        })
        if (error) {
          setMessage(error.code === 'weak_password' ? 'Choose a stronger password.' : 'Could not create your account. Check your details and try again.')
        } else {
          router.push('/auth/sign-up-success')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          setMessage('Email or password did not match. If you just registered, confirm your email first.')
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle()
          router.push(profile ? '/' : '/onboarding')
          router.refresh()
        }
      }
    } catch {
      setMessage('A connection error occurred. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label" htmlFor="auth-email">Email address</label>
      <input
        className="auth-input"
        id="auth-email"
        type="email"
        autoComplete="email"
        placeholder="you@campus.edu"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <label className="auth-label" htmlFor="auth-password">Password</label>
      <input
        className="auth-input"
        id="auth-password"
        type="password"
        autoComplete={signingUp ? 'new-password' : 'current-password'}
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {message && <p className="auth-error" role="alert">{message}</p>}
      <button className="button-primary auth-submit" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}
      </button>
      <p className="auth-switch">
        {signingUp ? 'Already have an account?' : 'New to Qampus?'}{' '}
        <Link href={signingUp ? '/auth/sign-in' : '/auth/sign-up'}>
          {signingUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  )
}
