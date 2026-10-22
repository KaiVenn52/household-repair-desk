# Household Repair Desk

**Tagline:** Plans change. Your approval should, too.

**Track:** Alexa+ — working MCP service and clearly labeled web simulation. No mini challenge claimed.

**Live demo:** https://household-repair-desk.ablepond1024.chatgpt.site

**Public video:** https://www.youtube.com/watch?v=Eh4b-RJH8jc

**Source:** https://github.com/KaiVenn52/household-repair-desk (public, MIT licensed)

A $130 repair quote looks cheaper until you notice that parts are extra. A $145 quote includes the standard seal, but a complete price still does not solve the household schedule. Just after Sam approves Monday, he can no longer be home.

Household Repair Desk keeps these decisions together. It compares scope, enforces the stated budget, checks fictional provider and household calendars, and requests explicit approval of the exact proposal. When availability changes, the old proposal and approval are withdrawn. Tuesday with Alex requires a new review and new consent. Reload preserves the task and change history. Expired reviews, unavailable hosts and expired sample dates have separate recovery paths.

The same domain rules power a local Node/Express application and a hosted Worker with D1 storage. The official MCP SDK exposes eight tools using MCP 2025-11-25 and Streamable HTTP. Browser planning and household availability changes invoke the real HTTP endpoint. Hosted visitors have separate browser sessions; tools cannot approve a plan or expose its review secret. The live demo does not require a login.

The Alexa+ experience is a deterministic simulation, with fictional identities, providers, source quotes and calendars. No Alexa device, production Amazon API or runtime language model is connected. No contractor is contacted, no appointment is booked, and no payment is made.

Verification includes 22 passing domain/MCP tests, the complete local browser regression, hosted Worker checks, anonymous public workflow tests, two-browser isolation, reload persistence, axe A/AA scans and 375/768/1280 pixel layouts. Linux CI passed. The public 91-second English video uses the refined actual interface, disclosed stock synthetic narration and saved English captions.

For exact form answers, use READY-TO-PASTE.md. Product feedback and observed friction are in FEEDBACK.md and FRICTION-LOG.md. Registration, eligibility/rule attestations and final event submission are separate from these prepared materials; no accepted submission is claimed.
