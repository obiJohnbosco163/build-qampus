import type { Address } from 'viem'

export const registryAbi = [
  {
    type: 'function',
    name: 'anchor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'milestoneType', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getAnchor',
    stateMutability: 'view',
    inputs: [
      { name: 'student', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
    ],
    outputs: [
      { name: 'exists', type: 'bool' },
      { name: 'milestoneType', type: 'uint8' },
      { name: 'anchoredAt', type: 'uint64' },
      { name: 'blockNumber', type: 'uint64' },
    ],
  },
  {
    type: 'function',
    name: 'endorse',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'student', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'attestationHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'AnchorCreated',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'student', type: 'address' },
      { indexed: true, name: 'contentHash', type: 'bytes32' },
      { indexed: false, name: 'milestoneType', type: 'uint8' },
      { indexed: false, name: 'anchoredAt', type: 'uint64' },
    ],
  },
  {
    type: 'event',
    name: 'MilestoneEndorsed',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'student', type: 'address' },
      { indexed: true, name: 'contentHash', type: 'bytes32' },
      { indexed: true, name: 'endorser', type: 'address' },
      { indexed: false, name: 'attestationHash', type: 'bytes32' },
      { indexed: false, name: 'endorsedAt', type: 'uint64' },
    ],
  },
] as const

export type MilestoneType = 'siwes' | 'project' | 'internal_defence' | 'external_defence' | 'experience' | 'general'
export type MilestoneFingerprintInput = {
  milestone_type: MilestoneType
  title: string | null
  summary: string | null
  story: string | null
}

const milestoneCodes: Record<MilestoneType, number> = {
  siwes: 0,
  project: 1,
  internal_defence: 2,
  external_defence: 3,
  experience: 4,
  general: 5,
}

export function milestoneTypeCode(type: string) {
  return type in milestoneCodes ? milestoneCodes[type as MilestoneType] : -1
}

export function serializeMilestone(input: MilestoneFingerprintInput) {
  return JSON.stringify({
    version: 1,
    milestoneType: input.milestone_type,
    title: input.title ?? '',
    summary: input.summary ?? '',
    story: input.story ?? '',
  })
}

export { type Address }
