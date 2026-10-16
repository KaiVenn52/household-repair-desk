# Household Repair Desk

[![Verify repair workflow](https://github.com/KaiVenn52/household-repair-desk/actions/workflows/verify.yml/badge.svg)](https://github.com/KaiVenn52/household-repair-desk/actions/workflows/verify.yml)

Turn a leaking kitchen sink into a household-approved repair plan, with the quote exclusions still visible.

Independent Alexa+ hackathon prototype. The web experience is a guided text simulation, not a live Alexa client or language model. The MCP server is real and uses the official SDK over Streamable HTTP. Quotes, providers, household members and calendars are fictional. Approval creates a local household record; no contractor is contacted and no booking or payment occurs.

## Run locally

Requires Node.js 22 or newer (developed with Node 24.20.0).

```powershell
cd amazon-alexa-household
npm.cmd ci
npm.cmd start
```

Open http://127.0.0.1:4317. The server binds to loopback only. It does not need credentials, an Alexa device, an Amazon account or an external model. Stop with Ctrl+C.

## Try the complete flow

- Report: `The kitchen sink is leaking under the cabinet.`
- Select **Compare sample quotes**, then open both source quote links.
- Choose Homekind. Monday morning is disabled because nobody is home.
- Choose Monday October 19, 14:00–15:00, then **Review & confirm**.
- Review provider, price, exclusions and time; choose Alex or Sam, check the confirmation box, and approve.
- Reload. The household plan and its audit timeline remain. Cancel if desired.

The quotes use USD and the calendar uses Asia/Kuala_Lumpur (UTC+08). Each new task generates dates for the next sample Monday/Tuesday and stores that calendar with the task. An existing task's dates never silently shift, and past appointments are rejected. This keeps new demonstrations usable throughout judging. The recorded October 16 demo shows October 19–20 appointments. This is an intentionally bounded leaking-sink fixture, not a universal repair adviser.

## MCP client connection

Endpoint: `http://127.0.0.1:4317/mcp`, protocol `2025-11-25`, Streamable HTTP. The official SDK is imported and invoked in `src/mcp.js` and `src/server.js`. `tests/mcp.test.js` runs an independent official SDK client against an ephemeral HTTP server.

Tools: `report_repair`, `compare_quotes`, `propose_repair`, `get_repair`, `list_repairs`, `cancel_repair`. No approval, payment or external booking tool exists. The browser review path issues an expiring secret for explicit local confirmation; public task responses and MCP outputs omit it.

## Verification

```powershell
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:ui
```

Tests cover quote scope, unsupported repair types, household/provider conflicts, stale updates, explicit confirmation, expired/cancelled/replayed approvals, disk persistence and actual MCP HTTP calls. Browser checks exercise report through approval, reload, cancellation, validation errors, axe accessibility scans and three viewport widths. Evidence goes in `evidence/`.

On this Windows machine the browser test uses the existing Google Chrome installation. A separate Playwright browser download is needed only if that installation is absent. The test script chooses it automatically. `node scripts/manifest.mjs` refreshes the SHA-256 delivery manifest, excluding dependencies and runtime household data.

## Data and limits

`data/tasks.json` stores this demo household on the local machine. Writes use a temporary file and rename. Run one server process per data file. There is no household authentication, tenant isolation, contractor API, calendar API, actual document extraction or LLM. Prices are normalized from the two included text fixtures in code; this prototype does not claim arbitrary PDF ingestion. The browser and MCP share the same domain logic, but the guided browser uses local HTTP API routes rather than making an LLM call. A compatible model client can independently invoke the MCP tools.

Host/Origin validation and a restrictive content policy protect the local demo. Loopback access is a development boundary, not production authentication. Do not expose this server through a tunnel or public host. Real household use needs authenticated identities, authorization, isolated storage, fresh quotes, current calendars, provider integrations and a separate explicit external-action review.

## Submission materials

Public source: https://github.com/KaiVenn52/household-repair-desk

Download the real 140.8-second 1080p demo and English captions from the [release](https://github.com/KaiVenn52/household-repair-desk/releases/tag/v0.1.0). It uses actual app footage and disclosed synthetic narration. This GitHub asset is a preview; the hackathon's required public YouTube/Vimeo URL is a separate prerequisite and is not claimed here.

See `submission/PROJECT.md`, `submission/DEMO-SCRIPT.md`, `submission/UPLOAD-METADATA.md`, `submission/FEEDBACK.md`, `docs/RULES-CHECK.md`, and `STATUS.md`. Event registration and final submission are not yet evidenced. No X post has been published.

## Reproduce the video (Windows)

The application itself does not need video tooling. To reproduce this optional recording, install FFmpeg/FFprobe and use an installed en-US Windows voice. Run `scripts/narration-local.ps1` in Windows PowerShell 5.1, `npx.cmd playwright install ffmpeg`, `node scripts/record-demo.mjs`, then `python scripts/render-demo.py`. Narration is generated locally. `scripts/narration.py` is an optional Edge TTS path; that online service returned 403 during this preparation, so it was not used for the delivered voice.
