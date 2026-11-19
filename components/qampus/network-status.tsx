'use client'

import useSWR from 'swr'

type NetworkStatusData = {
  chain: string
  evmChainId: number | null
  reachable: boolean
}

async function fetchNetworkStatus(url: string): Promise<NetworkStatusData> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('QoreChain testnet is unavailable')
  return response.json() as Promise<NetworkStatusData>
}

export function NetworkStatus() {
  const { data } = useSWR('/api/chain', fetchNetworkStatus, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })

  const online = data?.reachable === true && data.evmChainId === 9800

  return (
    <span className="footer-build" aria-live="polite">
      <span className={online ? 'network-status-dot is-online' : 'network-status-dot'} aria-hidden="true" />
      {online ? 'DIANA TESTNET · CHAIN 9800' : 'DIANA TESTNET · STATUS UNKNOWN'}
    </span>
  )
}
