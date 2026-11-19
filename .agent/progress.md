# Qampus build log

## Current phase
P0 — environment, scaffold, QoreChain SDK verification.

## Decisions
- Existing project is Next.js 16 App Router + TypeScript + Tailwind + pnpm. Kept this scaffold rather than overwriting it with the official Vite `fullstack-web` template; it preserves the app's requested framework and provides the same baseline app role.
- QoreChain SDK packages were queried from npm and installed at the published versions; installed READMEs/types take precedence over proposal assumptions.
- Supabase is connected; the live project has zero tables. Do not write app data code until its RLS schema is applied.

## Environment checks
- Node v24.16.0; pnpm 12.3.4; Git 2.50.1; jq 1.8.1.
- Foundry `forge` is not installed in the sandbox.
- `pnpm add` fetched and linked QoreChain SDK packages, but exited with `ERR_PNPM_IGNORED_BUILDS` because `protobufjs@6.11.6`'s build script is not approved. Investigate before relying on package code.
- No MCP servers are connected to the v0 agent. QoreChain MCP CLI mode and tool invocation remain to verify.

## API corrections
- `@qorechain/wallet-adapter@0.6.0` documents QoreX's `qorexSignAndBroadcast` as the dApp transaction path; the QoreX wallet owns PQ key registration and the app must not derive/store wallet PQ secrets. QoreX controls PQC key and EVM-window management; the adapter rejects dApp requests to manage those keys/windows.
- `@qorechain/sdk@0.14.0` docs/types confirm `createClient`, `connectTx`, `ensurePqcRegistered`, EVM window helpers and KEM key reads. Diana testnet should pass `rest` so hybrid-sign-byte version is discovered at runtime.
- `@qorechain/handles@0.1.0` verifies signed handle records against a pinned registry key and injected TOFU pin store; it is not a simple untrusted handle lookup.
- `@qorechain/qoreseal@0.1.0` supports client-side ML-KEM-1024 envelopes and network key resolution; its README notes the construction is pending external review before 1.0.

## Proofs
- npm registry versions checked: sdk/evm 0.14.0; wallet-adapter 0.6.0; qoresign 0.2.0; pqc 0.2.3; qoreseal/handles 0.1.0; mcp/qore-cli/qorex-wallet-mock/qorex-synpress/qorescan 0.1.1/0.1.1/0.1.0/0.1.0/0.1.0.
- Proposal copied to root `README.md` as requested.

## Next
Resolve install script approval, run QoreChain MCP `get_chain_info`, build the first product slice, then request QoreX/faucet actions from the user when needed for real testnet transactions.
