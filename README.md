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
- Compare the source quotes, or enter **140** under **Keep the known total under** and select **Find a plan**. Planning stops without raising your cap.
- Explicitly change the cap to **150**. The planner chooses the $145 complete fixture and the earliest feasible household slot.
- Review and approve Monday as Sam, then select **Sam can't cover Monday**.
- The old plan is withdrawn. Select **Find another time**, review Tuesday as Alex and approve afresh.
- Reload and inspect the saved decision history. No contractor has been booked.

The quotes use USD and the calendar uses Asia/Kuala_Lumpur (UTC+08). Each new task generates dates for the next sample Monday/Tuesday and stores that calendar with the task. An existing task's dates never silently shift, and past appointments are rejected. This keeps new demonstrations usable throughout judging. The recorded October 16 demo shows October 19–20 appointments. This is an intentionally bounded leaking-sink fixture, not a universal repair adviser.

## MCP client connection

Endpoint: `http://127.0.0.1:4317/mcp`, protocol `2025-11-25`, Streamable HTTP. The official SDK is imported and invoked in `src/mcp.js` and `src/server.js`. `tests/mcp.test.js` runs an independent official SDK client against an ephemeral HTTP server.

Tools: `plan_repair`, `update_household_availability`, `report_repair`, `compare_quotes`, `propose_repair`, `get_repair`, `list_repairs`, `cancel_repair`. No approval, payment or external booking tool exists. The browser review path issues an expiring secret for explicit local confirmation; public task responses and MCP outputs omit it.

## Verification

```powershell
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:ui
```

Tests cover quote scope, unsupported repair types, household/provider conflicts, stale updates, explicit confirmation, expired/cancelled/replayed approvals, disk persistence and actual MCP HTTP calls. Browser checks exercise report through approval, reload, cancellation, validation errors, axe accessibility scans and three viewport widths. Evidence goes in `evidence/`.

On this Windows machine the browser test uses the existing Google Chrome installation. A separate Playwright browser download is needed only if that installation is absent. The test script chooses it automatically. `node scripts/manifest.mjs` refreshes the SHA-256 delivery manifest, excluding dependencies and runtime household data.

## Data and limits

`data/tasks.json` stores this demo household on the local machine. Writes use a temporary file and rename. Run one server process per data file. There is no household authentication, tenant isolation, contractor API, calendar API, actual document extraction or LLM. Prices are normalized from the two included text fixtures in code; this prototype does not claim arbitrary PDF ingestion. The browser invokes planning and availability through the official SDK over the local MCP endpoint. Other review routes use the shared domain layer directly. No LLM is invoked. A compatible model client can independently invoke the MCP tools.

Host/Origin validation and a restrictive content policy protect the local demo. Loopback access is a development boundary, not production authentication. Do not expose this server through a tunnel or public host. Real household use needs authenticated identities, authorization, isolated storage, fresh quotes, current calendars, provider integrations and a separate explicit external-action review.

## Submission materials

Public source: https://github.com/KaiVenn52/household-repair-desk

Current v0.2: [91.03-second narrated demo, captions and verified source archive](https://github.com/KaiVenn52/household-repair-desk/releases/tag/v0.2.0). Runtime commit ceca672 passed [Linux CI](https://github.com/KaiVenn52/household-repair-desk/actions/runs/38916798878). This release is a review copy; required YouTube/Vimeo hosting and final event submission remain pending.

The previous v0.1 demo is preserved in the [release](https://github.com/KaiVenn52/household-repair-desk/releases/tag/v0.1.0). It uses actual app footage and disclosed synthetic narration. This GitHub asset is a preview; the hackathon's required public YouTube/Vimeo URL is a separate prerequisite and is not claimed here.

See `submission/PROJECT.md`, `submission/DEMO-SCRIPT-V2.md`, `submission/UPLOAD-METADATA.md`, `submission/FEEDBACK.md`, `docs/RULES-CHECK.md`, and `STATUS.md`. Event registration and final submission are not yet evidenced. No X post has been published. The original DEMO-SCRIPT.md is preserved as the v0.1 recording plan.

## Reproduce the video (Windows)

The application itself does not need video tooling. To reproduce this optional recording, install FFmpeg/FFprobe and use an installed en-US Windows voice. Run `scripts/narration-local.ps1` in Windows PowerShell 5.1, `npx.cmd playwright install ffmpeg`, `node scripts/record-demo.mjs`, then `python scripts/render-demo.py`. Narration is generated locally. `scripts/narration.py` is an optional Edge TTS path; that online service returned 403 during this preparation, so it was not used for the delivered voice.

## v0.2: when the household changes its mind

Set a $140 cap: neither quote is eligible, because the $130 subtotal excludes parts and the complete quote is $145. Explicitly change the cap to $150. The planner selects Homekind on Monday with Sam at home. Approve as Sam, then select "Sam can't cover Monday." The old proposal and approval are withdrawn. Find another time: Tuesday with Alex. A new proposal requires a fresh review and approval. Reload to see the saved decision and history.

The browser performs planning and availability changes via the real official SDK MCP client over HTTP. Eight tools are exposed; 14 domain/MCP tests and a full browser replan flow cover the changed behavior. Demo roles remain fictional and unauthenticated. No contractor is contacted. See docs/REFINEMENT-REVIEW.md and video/v2/video-verification.json for the refinement and recording evidence.

The v0.2 video uses a local Kokoro af_heart stock neural voice and a new eight-scene actual UI recording. See docs/REFINEMENT-REVIEW.md for optional reproduction, model provenance and Windows path handling. The old Windows voice reproduction remains available for the preserved v0.1 artifact.
