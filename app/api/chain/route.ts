import { NextResponse } from 'next/server'
import { qorechainClient } from '@/lib/qorechain/client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const chainId = await qorechainClient.evm.ethChainId()
    const evmChainId = Number.parseInt(chainId, 16)

    return NextResponse.json(
      {
        chain: 'qorechain-diana',
        evmChainId,
        reachable: evmChainId === 9800,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { chain: 'qorechain-diana', evmChainId: null, reachable: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
