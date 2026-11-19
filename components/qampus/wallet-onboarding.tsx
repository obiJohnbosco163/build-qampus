'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getQorexNative } from '@qorechain/qorex-types'

type WalletSignature = {
  pub_key?: { type?: string; value?: string }
  signature?: string
}

export function WalletOnboarding() {
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')
  const [connectedAddress, setConnectedAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const wallet = getQorexNative()
      if (!wallet) throw new Error('QoreX was not detected in this page. Unlock the extension, reload Qampus, and try again.')

      const chainId = 'qorechain-diana'
      await wallet.enable(chainId)
      const key = await wallet.getKey(chainId)
      const address = key.bech32Address
      if (!address?.startsWith('qor1')) throw new Error('Switch QoreX to the QoreChain Diana network and try again.')
      setConnectedAddress(address)

      const challengeResponse = await fetch('/api/auth/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const challenge = await challengeResponse.json()
      if (!challengeResponse.ok) throw new Error(challenge.error ?? 'Could not start wallet verification.')

      const signed = await (wallet.signArbitrary(chainId, address, challenge.message) as Promise<WalletSignature>)
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
      router.push('/feed')
      router.refresh()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      setError(
        message.includes('signArbitrary')
          ? 'QoreX connected successfully, but its current browser extension does not support the secure message signature Qampus requires to verify wallet ownership. Profile setup cannot finish until QoreX adds message-signing support.'
          : message || 'Wallet connection failed. Please try again.',
      )
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
      {connectedAddress && <p className="auth-hint" role="status">Connected QoreX wallet: <span className="wallet-address">{connectedAddress}</span></p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button-primary auth-submit" type="submit" disabled={busy}>
        {busy ? 'Waiting for wallet…' : 'Connect QoreX wallet'}
      </button>
      <p className="auth-privacy">Qampus never asks for your seed phrase. Wallet ownership verification requires secure message signing, which the current QoreX extension does not yet provide.</p>
    </form>
  )
}
