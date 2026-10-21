# Product review — 2026-10-21

## What changed

The review used the existing household repair workflow, not a redesign. A reproducible dead end was found: with a $150 cap and both hosts away, the interface said no complete quote fit the budget, even though the $145 fixture did fit. It offered no way to restore a host through the interface. Before/after rendered evidence is in evidence/availability-before.png and evidence/availability-after.png. The baseline was captured before changes to runtime commit a0bef21. The current fixture scenario is reproducible with node scripts/audit-availability.mjs; a guard prevents overwriting the baseline with the fixed implementation.

v0.3 distinguishes budget, availability and expired-calendar blockers. A host can explicitly become available again, after which a separate planning action issues a new proposal. Old consent remains invalid. Actual quote/slot checks are exposed for inspection. A selected notebook task survives reload; an obsolete saved selection falls back safely. Expired sample dates lead to a new report while preserving the historical task.

Visual review then found repeated explanations and poor mobile ordering. Active mobile tasks now put the current decision first, with conversation below it. The DOM order follows the visible order, with a browser assertion for both mobile and desktop layouts, rather than changing only CSS presentation. Availability recovery has one main explanation rather than a red error plus a duplicate card. Planning checks are available beside the decision, collapsed by default.

## Internal quality assessment

These are internal prototype-review scores, not judge scores, measured customer results or a prediction of a prize.

| Dimension | Score / 10 | Evidence and limit |
|---|---:|---|
| Onboarding | 7 | English first screen names the repair and discloses the simulation. The supported problem remains deliberately narrow. |
| Core experience | 8 | Compare, budget, consent, withdrawal, replan and host-restoration flows are executable. |
| Error handling | 8 | Wrong budget, expired review, unavailable hosts and old dates have distinct recovery paths. |
| Information architecture | 8 | Current task first on mobile; selected notebook record persists; explanations expand on demand. |
| Visual polish | 7 | Desktop/mobile screenshots inspected; duplicate blocking notices removed. No external design study was conducted. |
| Performance | 6 | Local actions complete in the verified flow; no concurrent-load or external-service latency benchmark exists. |
| Accessibility | 7 | Tested axe WCAG tags, keyboard reachability and viewport overflow. This is not a full screen-reader certification. |
| Completeness | 6 | Complete bounded fixture workflow; no real Alexa device, authenticated household, live calendar or contractor API. |

## Official judging criteria mapping

The official rules were rechecked on October 21: https://amazonappdev2026.devpost.com/rules . Technical implementation, design, potential impact and idea quality are equally weighted. This review maps evidence to those criteria; it does not assign official scores.

- Technical implementation: actual official SDK tools over Streamable HTTP, versioned state and tested rejection paths. Planning checks come from the same computations that choose the plan.
- Design: changes in household circumstances have clear, recoverable effects. Changing a calendar does not silently approve a replacement.
- Potential impact: a concrete household handoff problem. No user interviews, adoption, revenue or time-savings measurements are claimed.
- Idea quality: persistent context and proposal-specific consent across changing constraints. The experience remains a deterministic simulation, not a connected Alexa agent or language model.

## Verification and iteration

Four new domain tests failed before implementation and pass after it. Full domain/MCP coverage is now 22 tests. Browser checks extend the previous workflow with both hosts unavailable, restoration, planning checks, saved notebook selection and expired dates. Screenshot review triggered the second mobile/copy refinement. Current machine-readable browser results are in evidence/browser-report.json.

One rerun encountered a Windows UNKNOWN error while opening evidence/expired-review-recovery.png for screenshot output. That is an evidence-file write failure; it is not counted as a product-flow pass or attributed to an Amazon service. A fresh browser rerun passed, and the final DOM-order refinement also passed its full browser rerun. No check was skipped.

## What still prevents a complete event entry

Participant eligibility/experience attestation, a verified public YouTube/Vimeo URL and final participant approval are still required. The GitHub recording is a review copy. No registration, device connection, deployment or final submission is inferred from local tests. The existing narrated 91.03-second primary demo is preserved; it does not claim to show the newly added recovery branches.
