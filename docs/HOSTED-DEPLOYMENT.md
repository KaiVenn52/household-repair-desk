# Hosted review deployment

The local Express app remains unchanged and loopback-only. The hosted build uses a separate Web Standards Worker adapter and the same RepairDesk domain rules and official MCP SDK.

- Per-browser fictional households are stored in D1 behind a random HttpOnly, Secure, SameSite=Strict cookie. Expiry is 48 hours; a second browser cannot see or change the first browser's repairs.
- Browser planning and availability routes invoke the hosted /api/mcp endpoint over real HTTP through the official SDK, using only that visitor's demo cookie. Sites reserves /mcp at its gateway, so the standalone 2025-11-25 endpoint uses /api/mcp; it is not a Sites plugin registration.
- The MCP interface supports protocol 2025-11-25. It has no booking, payment or approval tool. Explicit UI approval remains required.
- D1 writes use compare-and-swap revisions, rejecting concurrent changes. 12 repairs, 150 KB state, 50 recent tool receipts and 16 KB request bodies bound a demo session.
- Cross-origin and cross-site requests are rejected. Public task JSON omits confirmation secrets.
- Embedded assets preserve the refined UI. Hosted copy states that sample notes are stored on the server and this browser session expires after 48 hours. The UI asks visitors to use sample details only.
- The build carries schema-only D1 migration 0000_repair_sessions; request handlers do not create or alter tables.

Local validation before publication: 22 domain/MCP tests passed; original full UI flow passed; bundled Worker flow passed with two independent browser contexts and SQLite-backed D1 adapter. Hosted UI axe A/AA and 375/768/1280 pixel checks passed. These results alone do not establish public availability.

The project ID in .openai/hosting.json is the sole hosted site identity. Do not create a duplicate site on retries. Source, saved version, deployment and anonymous public workflow verification must be recorded separately before handing the link to judges.
