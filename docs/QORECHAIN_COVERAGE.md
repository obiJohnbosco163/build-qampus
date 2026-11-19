# QoreChain coverage

This ledger distinguishes installed packages from exercised application paths. Testnet chain inventory is not evidence that Qampus itself has a deployed contract or signed a transaction.

| Kit / capability | Status | Evidence / remaining work |
| --- | --- | --- |
| `@qorechain/sdk` | Partial | Used for address conversion and EVM-window error guidance in wallet and verification flows. No PQ key registration or live hybrid transaction was exercised. |
| `@qorechain/evm` + `viem` | Partial | Contract ABI, Diana client, receipt/event checks, and public verification are implemented. Registry address is not configured and no Qampus contract is deployed. |
| QoreX wallet / wallet adapter | Partial | Linked-wallet ownership checks and EVM authorization-window guidance exist. The wallet adapter flow and a real QoreX signature were not exercised. |
| `@qorechain/qorex-types` | Installed only | No exercised application import or wallet-mock test yet. |
| `@qorechain/qoresign` | Exercised in code | SIWQ challenge creation and signature verification are used by the wallet-link endpoints; no live wallet login was performed in this environment. |
| `@qorechain/pqc` | Installed only | The app's content fingerprint is currently implemented in its existing chain helper; package hashing and ML-DSA verification are not a completed user flow. |
| `@qorechain/qoreseal` | Installed, disabled | No sealed-post UI or key persistence. QoreSeal 0.1.0 documents that its construction is pending external review; do not enable until key lifecycle/recovery and review are addressed. |
| `@qorechain/handles` | Installed only | Current handle lookup uses the Supabase profile table; signed registry resolution and pin management are not integrated. |
| `@qorechain/mcp` | Exercised | The verifier uses an in-process Streamable HTTP MCP transport and read-only `get_transaction` / `get_pq_status` tools. A live `get_chain_info` call returned Diana testnet details on 2026-11-19. The verifier endpoint needs an authenticated session and has a per-instance best-effort request limit. |
| AI SDK + AI Gateway | Implemented, chain answer unverified | The verifier explains MCP transaction and PQ status data; it receives only public anchor metadata, not milestone text. No anchor-specific AI response could be exercised because no Qampus contract/anchor is deployed. |
| `@qorechain/qore-cli` | Installed only | No CLI command was run. |
| `@qorechain/qorex-wallet-mock` / Synpress | Installed only | Playwright security tests do not yet exercise a wallet connection or anchor. |
| `@qorechain/qorescan` | Exercised | `cbom.json` was generated with QoreScan 0.1.0 against Diana testnet and the local Solidity sources. It is an inventory aid, not an audit or certification. |
| Solidity QampusRegistry | Source/tests present | QoreScan found two Solidity files. `forge test` remains unverified because Foundry is unavailable in the sandbox; the contract is not deployed. |

## Human setup still needed

1. Deploy `contracts/QampusRegistry.sol` to Diana testnet and configure `NEXT_PUBLIC_QAMPUS_REGISTRY_ADDRESS`.
2. Use a throwaway QoreX account with a coin-type-60 EVM account, register its PQ key, and open the EVM authorization window before any EVM write.
3. Grant moderators only through trusted Supabase Auth `app_metadata` with `role: "moderator"`; never set this in user-editable `user_metadata`.
4. Do not claim an anchor, endorsement, sealed post, or AI verification is live until a real transaction and the corresponding end-to-end verification have been recorded.
