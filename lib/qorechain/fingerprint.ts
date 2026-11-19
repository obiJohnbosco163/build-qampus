import { keccak256, toBytes } from 'viem'
import type { MilestoneFingerprintInput } from './registry'
import { serializeMilestone } from './registry'

export function milestoneFingerprint(input: MilestoneFingerprintInput) {
  return keccak256(toBytes(serializeMilestone(input)))
}
