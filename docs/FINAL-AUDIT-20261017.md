# Final audit — 2026-10-17, Asia/Kuala_Lumpur

## Result

v0.2.1 keeps the v0.2 planning story and adds recoverable expired reviews, actionable MCP input errors, and rejection of approval for an appointment whose start has passed. The existing 91.03-second v0.2 video still demonstrates the unchanged primary workflow. It does not claim to demonstrate the new recovery branch; current browser screenshots and tests cover it separately.

## Reproduced findings

| Trigger | Before | Corrected behavior |
|---|---|---|
| Submit null, text, negative or oversized budget to the planning HTTP route | SDK plain-text validation result was parsed as JSON; HTTP 500 | HTTP 400 INVALID_TOOL_ARGUMENTS with a useful planning hint; task unchanged |
| Leave the review modal open for more than 15 minutes and approve | Approval rejected; recovery asked user to cancel the task | Modal closes, expired review is visible, Renew review creates a new request for the same scope and time |
| Reuse a previous review secret after renewal | No renewal route existed | New proposal ID and secret; previous secret cannot approve the new proposal |
| Approve just after appointment start while the 15-minute review is still active | Past appointment could be approved | PAST_SLOT; saved plan unchanged |
| Enter abc as a browser budget | Generic server error and input reset | Specific validation message and original input retained |

The four new regression tests failed before the fix and passed afterwards. Full verification: npm.cmd test (18 passed) and npm.cmd run test:ui (PASS). Browser proof includes an expired open modal, renewal, fresh consent and reload, plus accessibility and mobile overflow checks. Browser plugin is not available; regular Playwright controls the installed Chrome.

Visual inspection caught a remaining old message telling the user to cancel while the new Renew review button was visible. That copy was corrected and the browser flow rerun.

## Rules and submission fit

Rechecked https://amazonappdev2026.devpost.com/rules on October 17. The Alexa+ route accepts the working MCP server and clearly identified simulation. The existing server negotiates 2025-11-25 over Streamable HTTP. English setup, source, demo, product feedback and the current field bank are prepared. The public video-platform URL and participant registration remain unverified; the GitHub MP4 is a review copy.

The product's evidence against the judging criteria is concrete: real official SDK HTTP calls and rejection tests; a complete review/replan/recovery experience; a specific household coordination problem; persistent context with consent tied to the actual proposal. There is no user study, measured savings or deployment evidence. These are evidence mappings, not awarded scores or a promise of winning.

## Remaining human gates

1. Participant eligibility, agreement to event rules and truthful prior Amazon development experience.
2. Public YouTube/Vimeo upload of the prepared MP4. The previous standard browser bridge file selection was rejected. No security barrier was bypassed and no successful upload is claimed.
3. Check the complete event form and approve final submission. No submission receipt exists.

No payment, real transaction, contractor contact, social post or final event submission occurred in this audit. All code, fixtures and evidence stay within this project.
