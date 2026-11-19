'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type WalletKey = { bech32Address?: string; address?: string }
type WalletSignature = {
  pub_key?: { type?: string; value?: string }
  signature?: string
}
type QoreWallet = {
  enable: (chainId: string) => Promise<void>
  getKey: (chainId: string) => Promise<WalletKey>
  signArbitrary: (chainId: string, signer: string, data: string) => Promise<WalletSignature>
}

declare global {
  interface Window {
    keplr?: QoreWallet
  }
}

export function WalletOnboarding() {
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const wallet = window.keplr
      if (!wallet) throw new Error('Install or unlock the QoreX wallet extension, then try again.')

      const chainId = 'qorechain-diana'
      await wallet.enable(chainId)
      const key = await wallet.getKey(chainId)
      const address = key.bech32Address ?? key.address
      if (!address?.startsWith('qor1')) throw new Error('Switch QoreX to the QoreChain Diana network and try again.')

      const challengeResponse = await fetch('/api/auth/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const challenge = await challengeResponse.json()
      if (!challengeResponse.ok) throw new Error(challenge.error ?? 'Could not start wallet verification.')

      const signed = await wallet.signArbitrary(chainId, address, challenge.message)
      if (!signed.signature || !signed.pub_key?.value) throw new Error('The wallet did not return a valid signature.')

      const verifyResponse = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: {
            signatureType: 'secp256k1',
            classical: {
              keyType: 'secp256k1',
              publicKey: signed.pub_key.value,
              signature: signed.signature,
            },
          },
          displayName,
          handle,
        }),
      })
      const result = await verifyResponse.json()
      if (!verifyResponse.ok) throw new Error(result.error ?? 'Could not verify your wallet.')
      router.push('/')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wallet linking failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label" htmlFor="display-name">Name</label>
      <input className="auth-input" id="display-name" autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      <label className="auth-label" htmlFor="handle">Qampus handle</label>
      <input className="auth-input" id="handle" autoComplete="username" maxLength={24} pattern="[A-Za-z0-9_]{3,24}" placeholder="campus_handle" value={handle} onChange={(event) => setHandle(event.target.value)} required />
      <p className="auth-hint">3–24 letters, numbers, or underscores. Your handle is public.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button-primary auth-submit" type="submit" disabled={busy}>
        {busy ? 'Waiting for wallet…' : 'Connect QoreX and verify'}
      </button>
      <p className="auth-privacy">Qampus asks QoreX to sign a short-lived, single-use challenge. It never asks for your seed phrase.</p>
    </form>
  )
}
