# Official rules check — 2026-10-16, Asia/Kuala_Lumpur

Sources: [official rules](https://amazonappdev2026.devpost.com/rules), [overview](https://amazonappdev2026.devpost.com/), [resources](https://amazonappdev2026.devpost.com/resources). Read live using the web tool. Agent Reach's Jina reader returned a 403 challenge; it was not treated as rule evidence.

The submission window is August 31–October 23, 2026. The deadline converts from October 23 at 12:00 PDT to October 24 at 03:00 MYT. Development can proceed now.

Alexa+ accepts an Agent Skill, a self-hosted MCP service using at least 2025-11-25 and Streamable HTTP, or a clearly demonstrated web simulation. This project prepares both a local MCP service and a labeled simulation; no device integration is claimed.

Required materials include functional source and setup instructions, a judging-accessible GitHub repository, an English description, a public YouTube/Vimeo demo under three minutes, and tool feedback. A private repository requires reviewer access. Judging access must remain available through November 20.

Malaysia is not expressly excluded; adulthood, conflicts and other personal eligibility conditions still need participant attestation. No registration is evidenced.

AWS credit requests closed October 7. No AWS or Open Source mini challenge is claimed. No payment, publication or final submission is authorized in this work round.

## Technical references

- [MCP 2025-11-25 transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [Official TypeScript SDK stateless HTTP example](https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/v1.x/src/examples/server/simpleStatelessStreamableHttp.ts)

Implementation choice: official SDK transport, JSON responses, per-request stateless MCP instances, a shared persistent domain store, loopback binding, and Host/Origin validation. These references support implementation choices, not a claim of Amazon certification.
