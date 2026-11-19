import { createPublicClient, defineChain, http } from 'viem'
import { qorechainClient } from '@/lib/qorechain/client'

export const qorechainEvm = defineChain({
  id: qorechainClient.network.evmChainId ?? 9800,
  name: 'QoreChain Diana',
  nativeCurrency: { name: 'QOR', symbol: 'QOR', decimals: 18 },
  rpcUrls: { default: { http: [qorechainClient.network.endpoints.evmRpc] } },
})

export const qorechainPublicClient = createPublicClient({
  chain: qorechainEvm,
  transport: http(qorechainEvm.rpcUrls.default.http[0]),
})

export function registryAddress() {
  const value = process.env.NEXT_PUBLIC_QAMPUS_REGISTRY_ADDRESS
  return /^0x[0-9a-fA-F]{40}$/.test(value ?? '') ? value as `0x${string}` : null
}
