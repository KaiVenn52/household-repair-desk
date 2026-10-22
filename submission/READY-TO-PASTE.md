# Household Repair Desk — final field bank

Prepared final English copy. Saved local text is not evidence of a saved event draft or submission.

## Project name
Household Repair Desk

## Elevator pitch
Compare the full repair cost, find someone to be home, and withdraw old approval when plans change. Every new plan needs fresh household consent.

## Primary track
Alexa+

## Mini challenges
None claimed.

## Live demo
https://household-repair-desk.ablepond1024.chatgpt.site

## Source repository
https://github.com/KaiVenn52/household-repair-desk
Public, MIT licensed, with local and hosted build instructions.

## Demo video
https://www.youtube.com/watch?v=Eh4b-RJH8jc

Published publicly on October 22, 2026. A cookie-free yt-dlp metadata check confirms availability=public and duration=91 seconds. Separate English captions were uploaded and saved.

## Built with
JavaScript, Node.js, Express, official Model Context Protocol SDK, Zod, Streamable HTTP, Cloudflare Workers and D1 through Sites, esbuild, Playwright, axe-core. Preparation: Codex, Kokoro, FFmpeg.

## Inspiration
A repair can fall apart after everyone agrees to it. One person has the quote, another has the calendar, and the cheapest number may leave out parts. We focused on the moment after a plan is made: if nobody can be home anymore, that plan should lose its approval immediately.

## What it does
Household Repair Desk follows a fictional leaking kitchen sink from report to a recorded household decision. It compares a $130 subtotal with unknown parts against a $145 quote that includes the standard seal, keeps the budget explicit, and chooses the earliest future time that works for the provider and someone at home.

After Sam approves Monday, changing his availability withdraws the old plan and its approval. The planner can propose Tuesday with Alex, but Alex must review and approve that new proposal. An expired review can be renewed without reviving old consent. If both hosts are away, the app explains the calendar blocker instead of asking for a larger budget.

The public demo needs no login or installation. Each browser receives an isolated demo household stored on the server; sessions expire after 48 hours. All identities, quote documents, providers and calendars are fictional. No contractor is contacted, no appointment is booked, and no payment is made.

## How we built it
The same RepairDesk domain rules power the local Express application and a hosted Web Standards Worker. The official MCP SDK exposes eight tools using MCP 2025-11-25 and Streamable HTTP. Browser planning and availability changes invoke the actual HTTP MCP endpoint, not a label-only mock. The hosted endpoint is /api/mcp because the hosting gateway reserves /mcp; the local endpoint remains /mcp.

Approval is a separate browser review operation requiring the exact current proposal, its version, an expiring confirmation secret and explicit consent. Tools cannot approve a plan. Public task responses omit confirmation secrets. Hosted storage uses D1 and revision checks to reject conflicting writes. A random HttpOnly browser cookie isolates visitors; it is a demo session, not real household identity verification.

The Alexa+ experience is a clearly labeled deterministic simulation. There is no live Alexa device, production Amazon API or runtime language model connection.

## Challenges
We had to distinguish an unknown final price from a lower subtotal, and a calendar problem from an insufficient budget. We also had to invalidate both pending and completed approvals after schedule changes, without erasing the decision history. Fixed example dates would expire before judging, so new tasks generate future sample slots while old tasks keep their original calendar snapshot.

Public deployment exposed a reserved MCP path and a CSP incompatibility with the hosting edge. We moved the standalone hosted endpoint to /api/mcp, added a per-response script nonce, and repeated the full anonymous browser workflow against the deployed site.

## Accomplishments
A complete public, working demo with explicit household approval, recoverable failures and actual MCP transport calls. All 22 domain/MCP tests pass. Browser verification covers budgets, unavailable slots, approval, cancellation, changed availability, expired reviews, restored hosts, saved selection and stale dates. A separate anonymous public test verifies the deployed workflow, two-session isolation, persistence, accessibility and 375/768/1280 pixel layouts. Linux CI also passes.

## What we learned
An assistant should not treat a plan as authority to act. The useful work is keeping the scope, schedule and approval tied to the same current proposal, and being precise about what changed when that proposal stops working.

## What is next
Authenticated household roles, live quotes, real calendar integration and an assistant model client. Each would retain the same explicit approval boundary; real external bookings or payments would require an additional reviewed action. No user study or measured financial savings are claimed.

## Testing instructions
Open the public demo. Report: The kitchen sink is leaking under the cabinet. Set the budget to 140 and select Find a plan: the complete scope cannot fit. Explicitly change the cap to 150, find the plan, review and approve as Sam. Select Sam can't cover Monday, then Find another time. Review the new Tuesday plan as Alex and approve afresh. Reload and inspect Decision history. Use fictional details only.

## Product feedback and friction log
Use submission/FEEDBACK.md and submission/FRICTION-LOG.md. No AWS Builder or Open Source mini challenge is claimed. No actual Alexa device or preview API experience is asserted.

## Final review boundary
Registration eligibility, rule acceptance and prior Amazon development experience require the participant's truthful answers. The final event submission action remains unperformed until the user approves the completed form.
