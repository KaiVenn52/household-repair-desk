# Final field bank — Household Repair Desk

Prepared English text. These are content blocks for the final form, not proof that an online submission was saved. Exact event fields can only be audited after registration is completed.

## Project name

Household Repair Desk

## Elevator pitch

Turn a leaking kitchen sink into a household-approved repair plan: compare quote exclusions, match sample calendars, and keep an auditable decision before anyone contacts or pays a contractor.

## Primary track

Alexa+

## Build with

Node.js, JavaScript, Express, Model Context Protocol, official MCP TypeScript SDK, Zod, Streamable HTTP, Playwright, axe-core.

## Repository URL

https://github.com/KaiVenn52/household-repair-desk

## Demo URL

Required public YouTube/Vimeo URL: pending a successful upload. Do not paste a placeholder or the GitHub release in this field as if it met the platform requirement.

Review copy: https://github.com/KaiVenn52/household-repair-desk/releases/tag/v0.1.0

## What inspired us

A household repair often stalls between “I'll sort it” and an actual decision. One person has a quote, another knows the calendar, and the cheapest-looking number may exclude parts. We wanted an assistant that keeps that coordination visible without quietly turning a proposal into a booking.

## What it does

Household Repair Desk follows one leaking kitchen sink from report to a saved household decision. It compares two fictional source quotes, explains the unknown parts cost and warranty difference, checks sample provider and household availability, and asks Alex or Sam to explicitly review the exact plan. The task and timeline survive reloads and server restarts. Cancellation is recorded locally.

## How we built it

A Node.js application exposes six tools through the official MCP SDK using protocol 2025-11-25 and Streamable HTTP. The browser and MCP share domain rules for task state, quote scope, availability, versions and cancellation. Approval is a separate local browser operation requiring a current proposal, an expiring review secret and explicit consent. It is a demo interaction boundary, not production identity verification.

Each task stores its own fictional calendar snapshot, so fresh demonstrations work during judging while an old plan's dates do not silently move. The English browser experience is a deterministic guided simulation, not a live Alexa client or LLM.

## Challenges we ran into

The scope difference between a subtotal and an all-in price was more useful than simply sorting quotes by price. We also separated “household approved” from “contractor booked,” rejected unavailable times and stale confirmations, and replaced fixed sample dates so judging-period demos remain usable. Linux CI exposed an asynchronous dialog assertion in the test harness; waiting for the visible review state fixed it.

## Accomplishments

A complete bounded workflow, actual MCP HTTP calls with the official client, persistent task state, source-visible exclusions and explicit approval/cancellation behavior. Automated verification covers nine domain/MCP tests plus the browser flow, an axe scan of the approved state and three viewport widths. Public GitHub CI provides reproducible evidence.

## What we learned

The useful assistant behavior is not choosing the lowest number. It is explaining what that number leaves out, finding a time somebody can supervise, and keeping authority to act separate from the plan.

## What's next

Authenticated household roles, current provider quotes, real calendars and a model client can build on the same review boundary. The prototype does not claim those integrations today. External bookings and payments would need their own reviewed action and evidence.

## Product feedback

Use the complete, source-specific answers in `submission/FEEDBACK.md`. No actual Alexa device or preview API feedback is claimed. No AWS or Open Source mini challenge is claimed.

## Testing instructions

Clone the public repository, install Node.js 22 or newer, run `npm ci` and `npm start`, then open http://127.0.0.1:4317. Report “The kitchen sink is leaking under the cabinet,” compare both quotes, choose Homekind and an available afternoon slot, review as Sam, check the consent box and approve. Reload and inspect the saved timeline. No credentials, device or paid service is required. All household identities, providers, quotes and calendars are fictional.

## Truthful disclosure

Local app and MCP service: implemented and tested. Real Alexa runtime, runtime model, authenticated household users, real calendars, contractor contact, booking and payment: not implemented or claimed. Codex assisted development. The video uses actual UI footage and disclosed synthetic English narration.
