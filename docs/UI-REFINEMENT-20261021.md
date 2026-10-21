# UI refinement — 21 October 2026

Direction: a practical household maintenance workspace. This replaces the previous promotional serif headline, sage/beige palette, chat bubbles and repeated rounded cards.

- A compact app masthead replaces the landing-page hero; the repair workspace starts higher on the page.
- The desktop layout gives more width to repair details. Household notes use a quiet activity rail rather than chat bubbles.
- Quote comparison uses a divided invoice-style layout; costs use aligned numeric typography. Blue marks the complete-scope quote and primary actions.
- The proposed visit has labelled Visit and Known total fields and a separate household approval record.
- Mobile retains repair-first DOM order, wraps quote columns, and provides full-width report actions at small widths.
- Local simulation, fictional identities and the no-booking boundary remain explicit.
- Keyboard focus and reduced-motion handling are retained. No generated imagery, downloaded fonts or new dependencies.

Validation after the final appointment layout: npm test (22 passed); npm run test:ui (PASS). Browser checks cover report, comparison, unavailable slots, explicit approval, cancellation, hard budget caps, household changes, new consent, expired reviews, unavailable hosts, restoration, saved task selection, expired dates and keyboard access. Axe scans report no WCAG A/AA violations in the tested approved, withdrawn, expired-review and availability-blocked states. 375 / 768 / 1280 px checks show no horizontal overflow. No unexpected page or console errors.

Evidence: ../evidence/ui-refresh/before-initial.png and before-quotes.png preserve the old design. Updated desktop-initial.png, desktop-quotes.png, desktop-approved.png and viewport-375.png show the new design. Browser report: ../evidence/browser-report.json.

Video v3 records the revised actual UI with the existing conversational English narration and individual subtitle lines. It uses fictional household data and real local HTTP MCP calls; it does not show a live Alexa connection. See ../video/v3/video-verification.json for the completed media checks. The older v2 video and public release remain intact.

No external publication or final submission is performed in this refinement pass. Winning is not verified or guaranteed by a UI review. Remaining submission work includes the qualifying public video URL and final entry review.

Completed media validation: v3 is 91.0 seconds, 1920 x 1080, 30 fps, H.264 with AAC narration. Decoded quote, approval-dialog and replanning frames were visually inspected. The audio stream measures mean -15.8 dB and peak -1.3 dB (FFmpeg volumedetect). File SHA-256: 4b224fabf1a1081e9f493b5db007ac06d31e6c9ae662cb93dd0106d892c6f1ff. Narration reuses the existing Kokoro af_heart synthetic voice; no new voice or voice cloning is claimed. The v3 recording uses upcoming October 26–27 sample appointments; fixed-clock regression screenshots intentionally use October 19–20.
