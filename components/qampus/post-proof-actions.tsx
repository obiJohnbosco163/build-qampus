'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWalletClient, custom, type Hex } from 'viem'
import { classifyEvmWindowRejection, qorToEvm } from '@qorechain/sdk'
import { qorechainEvm, qorechainPublicClient } from '@/lib/qorechain/evm'
import { milestoneFingerprint } from '@/lib/qorechain/fingerprint'
import { milestoneTypeCode, registryAbi, type MilestoneFingerprintInput } from '@/lib/qorechain/registry'

type Eip1193Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> }

declare global {
  interface Window { ethereum?: Eip1193Provider }
}

const registryAddress = process.env.NEXT_PUBLIC_QAMPUS_REGISTRY_ADDRESS as `0x${string}` | undefined

export function PostProofActions({ postId, post, walletAddress, alreadyAnchored }: {
  postId: string
  post: MilestoneFingerprintInput
  walletAddress: string
  alreadyAnchored: boolean
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function anchorMilestone() {
    if (!registryAddress || !/^0x[0-9a-fA-F]{40}$/.test(registryAddress)) {
      setMessage('The Qampus Registry contract is not configured yet.')
      return
    }
    if (!window.ethereum) {
      setMessage('Connect QoreX or another EVM wallet configured for QoreChain Diana.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const expectedAddress = qorToEvm(walletAddress).toLowerCase()
      const wallet = createWalletClient({ chain: qorechainEvm, transport: custom(window.ethereum) })
      const [account] = await wallet.requestAddresses()
      if (!account || account.toLowerCase() !== expectedAddress) {
        throw new Error('The connected EVM account does not match your linked QoreX wallet.')
      }
      const chainId = await wallet.getChainId()
      if (chainId !== qorechainEvm.id) throw new Error('Switch your wallet to QoreChain Diana (chain ID 9800).')

      const txHash = await wallet.writeContract({
        address: registryAddress,
        abi: registryAbi,
        functionName: 'anchor',
        args: [milestoneFingerprint(post), milestoneTypeCode(post.milestone_type)],
        account,
        chain: qorechainEvm,
      }) as Hex
      setMessage('Transaction submitted. Waiting for QoreChain confirmation…')
      await qorechainPublicClient.waitForTransactionReceipt({ hash: txHash })
      setMessage('Confirmed. Verifying the wallet, fingerprint, and contract event…')
      const response = await fetch('/api/anchor/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, txHash }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'The transaction could not be verified.')
      setMessage('Verified and added to your milestone record.')
      router.refresh()
    } catch (error) {
      const windowRejection = classifyEvmWindowRejection(error)
      const windowGuidance: Record<string, string> = {
        'no-window': 'Open an EVM authorization window in QoreX, then retry the anchor.',
        exhausted: 'Your QoreX EVM authorization window is exhausted. Open a new one and retry.',
        'no-pqc-key': 'Register the QoreX post-quantum key before opening an EVM window.',
        invalid: 'QoreChain rejected the EVM authorization window. Review its limits in QoreX.',
      }
      setMessage(windowRejection ? windowGuidance[windowRejection] : error instanceof Error ? error.message : 'Could not anchor this milestone. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (alreadyAnchored) return null

  return (
    <div className="proof-action-wrap">
      <button className="proof-anchor-button" type="button" onClick={anchorMilestone} disabled={busy || !registryAddress}>
        {busy ? 'Anchoring…' : registryAddress ? 'Anchor this milestone' : 'Registry not configured'}
      </button>
      <p className="proof-action-note">{registryAddress ? 'Requires the linked wallet and an active QoreChain EVM authorization window. Only the content fingerprint is written on-chain.' : 'The contract must be deployed and its public address configured before anchoring is available.'}</p>
      {message && <p className="proof-action-message" role="status">{message}</p>}
    </div>
  )
}
