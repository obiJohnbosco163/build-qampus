# Qampus build log

## Current phase
P1 — authenticated campus product, QoreChain registry and verification.

## Decisions
- Existing project is Next.js 16 App Router + TypeScript + Tailwind + pnpm; retained the scaffold.
- Supabase core schema is applied and RLS is enabled for profiles, posts, recipients, Circles, media, anchors, endorsements, and reports. Runtime app queries use the authenticated Supabase server client; only verified on-chain events are inserted with the admin client.
- Identity is email/password plus a linked QoreX wallet, per the user's choice. Never derive, request, or store wallet PQ secrets in the app.
- QoreChain documentation confirms EVM writes require a registered PQC key and an active EVM authorization window opened separately through QoreX. The EVM transaction itself is not described as a hybrid signature.

## Environment checks
- Node v24.16.0; pnpm 12.3.4; Git 2.50.1.
- Foundry `forge` and a separately hosted QoreChain MCP server are unavailable in this sandbox; the QoreChain MCP package can run in-process and its Diana testnet read path was exercised.
- Solidity contract and test sources compile with solc 0.8.30; Foundry test execution remains unverified.
- No registry contract address is configured and no contract has been deployed to Diana testnet.

## API corrections
- `@qorechain/wallet-adapter@0.6.0` documents QoreX's `qorexSignAndBroadcast` as the dApp transaction path; the QoreX wallet owns PQ key registration and the app must not derive/store wallet PQ secrets. QoreX controls PQC key and EVM-window management; the adapter rejects dApp requests to manage those keys/windows.
- `@qorechain/sdk@0.14.0` docs/types confirm `createClient`, `connectTx`, `ensurePqcRegistered`, EVM window helpers and KEM key reads. Diana testnet should pass `rest` so hybrid-sign-byte version is discovered at runtime.
- `@qorechain/handles@0.1.0` verifies signed handle records against a pinned registry key and injected TOFU pin store; it is not a simple untrusted handle lookup.
- `@qorechain/qoreseal@0.1.0` supports client-side ML-KEM-1024 envelopes and network key resolution; its README notes the construction is pending external review before 1.0.

## Proofs
- npm registry versions checked: sdk/evm 0.14.0; wallet-adapter 0.6.0; qoresign 0.2.0; pqc 0.2.3; qoreseal/handles 0.1.0; mcp/qore-cli/qorex-wallet-mock/qorex-synpress/qorescan 0.1.1/0.1.1/0.1.0/0.1.0/0.1.0.
- Proposal copied to root `README.md` as requested.

## Delivered in this pass
- Authenticated feed, milestone composer/detail, public Passports, consent-based Circle requests, inbox, settings/sign-out, and public verification page.
- QampusRegistry anchor/endorsement contract, fingerprint helper, receipt/event validation and Supabase anchor indexing route.
- QoreX-linked wallet matching and EVM-window messaging in the anchor UI.
- Security headers include baseline protections and a report-only CSP. TypeScript, production build, frozen lockfile, and six Playwright security tests pass.
- Added an authenticated post-report flow using the existing reports table and submitter-only RLS policy; users cannot report their own posts. Added a moderator-only report queue and decision action using server-controlled Supabase `app_metadata.role`; queue decisions do not remove content. Added a read-only AI verifier that calls QoreChain MCP transaction/PQ-status tools and explains only anchor metadata through AI Gateway.
- Exercised QoreChain MCP `get_chain_info` against Diana testnet (height 10,377,907 observed on 2026-11-19). Generated `cbom.json` with QoreScan 0.1.0 against testnet and the local Solidity files. Added MIT license, QoreChain coverage ledger, and report-only CSP header. Validation: `pnpm install --frozen-lockfile`, `pnpm exec tsc --noEmit`, `pnpm run build`, and `pnpm run test:e2e` passed (six tests).

## Remaining external setup / scope
- Deploy the contract and set `NEXT_PUBLIC_QAMPUS_REGISTRY_ADDRESS` before live anchors are possible.
- Sealed posts need an externally reviewed recipient-card and encryption-key lifecycle/recovery design; keep them disabled. Role-verified endorsements and @tag notifications remain unimplemented.
- Moderator role assignment requires trusted Supabase Auth `app_metadata.role=moderator`; no admin user was granted automatically. Moderator actions only dismiss/resolve reports and do not delete content.
- The verifier's MCP transport/tools and chain info call are proven, but its AI explanation for a Qampus anchor remains unverified until a contract is deployed and a real anchor is indexed. No anchor-specific LLM request was run.
- `forge test` could not run because Foundry is unavailable; the test suite only compiled with solc.
