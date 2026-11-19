'use client'

import { useState } from 'react'
import { Bot, LoaderCircle } from 'lucide-react'
import Link from 'next/link'

export function VerifierExplainer({ postId }: { postId: string }) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function askVerifier() {
    setBusy(true)
    setAnswer('')
    setError('')
    try {
      const response = await fetch('/api/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error ?? 'The verifier could not complete this check.')
        return
      }
      setAnswer(result.answer)
    } catch {
      setError('The verifier could not reach the chain service. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="verifier-explainer" aria-labelledby="verifier-heading">
      <div className="verifier-explainer-copy">
        <span className="verifier-icon"><Bot size={15} aria-hidden="true" /></span>
        <div><p className="section-label">[ AI VERIFIER / READ ONLY ]</p><h2 id="verifier-heading">Understand the chain evidence</h2><p>QoreChain MCP checks the transaction and PQ status; the AI explains what those records do and do not prove.</p></div>
      </div>
      <button className="platform-outline-button verifier-button" type="button" onClick={askVerifier} disabled={busy}>
        {busy ? <><LoaderCircle size={14} className="verifier-spinner" aria-hidden="true" /> Checking…</> : 'Ask Qampus Verifier'}
      </button>
      {answer && <p className="verifier-answer" role="status">{answer}</p>}
      {error && <p className="verifier-error" role="status">{error}{error.startsWith('Sign in') && <> <Link href="/auth/sign-in">Sign in</Link> to continue.</>}</p>}
    </section>
  )
}
