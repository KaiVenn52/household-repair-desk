# Household Repair Desk

**Tagline:** Plans change. Your approval should, too.

**Track:** Alexa+ — local MCP server with a clearly labeled web experience simulation.

## The problem

A repair does not stall because a household lacks another answer. It stalls because one person has the quote, another has the calendar, and nobody knows whether “I'll sort it” turned into a plan. A cheap quote can also hide exclusions that only appear when the contractor arrives.

## What it does

Household Repair Desk follows one leaking-sink repair from report to a local household decision. It compares two fictional quotes, makes the unknown parts cost explicit, shows warranty differences, checks sample provider and household availability, and asks a household member to review the exact plan. It keeps the task and timeline across reloads and server restarts.

The $130 quote excludes parts; the $145 quote includes a standard seal. The app explains the $15 scope difference without inventing a final price for the excluded parts. A morning slot is blocked because nobody is home. A valid afternoon proposal still waits for human review.

## How it works

A Node.js server exposes eight tools through the official Model Context Protocol SDK using Streamable HTTP. A persistent domain layer enforces legal state transitions, version checks and expiring reviews. The browser invokes planning and availability tools through the official MCP client over actual local Streamable HTTP; other routes share the same domain layer. It is a deterministic guided simulation; it does not pretend to be a connected Alexa device or LLM. MCP tools can prepare or cancel a plan, while approval is a separate browser review operation.

No booking, payment or contractor message is made. The product says “household plan approved,” not “contractor booked.” This separation is the central design decision: coordination can advance while authority to act remains visible.

## What is real and what is simulated

Real: executable code, official SDK tools over HTTP, local disk persistence, explicit browser confirmation and tested rejection paths.

Simulated: household identities, two providers, quote documents and calendars. No production identity, Amazon runtime, LLM, external scheduling or actual users have been validated.

## Next steps

Authenticated household roles, current provider quotes, calendar integration and a real model client are future work. Each would retain the same review boundary. The local prototype intentionally focuses on one end-to-end repair rather than a broad assistant menu.

## Fields still required

- Participant identity and eligibility attestation: not collected here.
- GitHub repository: https://github.com/KaiVenn52/household-repair-desk (public, MIT licensed; no reviewer invitation required for source access).
- Video: current v0.2 demo is 91.03 seconds at 1920×1080 with stock neural narration and subtitles: https://github.com/KaiVenn52/household-repair-desk/releases/tag/v0.2.0 . The v0.1 release is preserved; required YouTube/Vimeo upload is still pending.
- Final Devpost submission: not authorized or performed.
- Mini challenge: none claimed.

## v0.2: when the household changes its mind

Set a $140 cap: neither quote is eligible, because the $130 subtotal excludes parts and the complete quote is $145. Explicitly change the cap to $150. The planner selects Homekind on Monday with Sam at home. Approve as Sam, then select "Sam can't cover Monday." The old proposal and approval are withdrawn. Find another time: Tuesday with Alex. A new proposal requires a fresh review and approval. Reload to see the saved decision and history.

The browser performs planning and availability changes via the real official SDK MCP client over HTTP. Eight tools are exposed; 22 domain/MCP tests and complete browser replan/recovery flows cover the current behavior. Planning distinguishes budget, availability and expired-calendar blockers. Restoring a host still requires a new proposal and fresh consent; the actual planning checks are inspectable. Expired reviews renew the same scope/time with a new proposal and secret. Demo roles remain fictional and unauthenticated. No contractor is contacted. See docs/PRODUCT-REVIEW-20261021.md and video/v2/video-verification.json for current review and recording evidence.
