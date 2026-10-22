# Product feedback

This feedback concerns the tools actually used. We did not test an Alexa device, Amazon preview API, production household account, real calendar or real contractor integration.

## Official MCP SDK and Zod

We used @modelcontextprotocol/sdk 1.32.1 to expose eight tools and call planning and availability changes over real Streamable HTTP, using MCP 2025-11-25. Zod validates tool arguments. The standard SDK transport made the same workflow usable from the local application and a Web Standards Worker. We would use it again.

The main integration friction was error shape: schema validation can return plain-text tool content while our application failures use structured JSON. Our first adapter assumed both were JSON and converted a normal bad budget into HTTP 500. It now handles both shapes, returns an actionable error and preserves the task. A complete client adapter example covering both cases would improve onboarding. This was our integration assumption, not an SDK outage; tests/recovery.test.js reproduces the correction.

A future Alexa+ onboarding guide showing how an assistant proposal reaches explicit, auditable human approval would be valuable. We deliberately keep approval outside the MCP tools. This is a feature request based on the application architecture, not a report of testing an unavailable Alexa runtime.

## Node.js and Express

Node.js provides task IDs, local persistence and the built-in test runner. Express serves the local app, quote documents and review routes. Sharing one domain layer across browser and MCP paths reduced divergent state behavior. The local application starts without Amazon credentials or paid services, which is useful for independent review. File persistence is suitable for the local prototype; the public adapter uses a database and isolated visitor state instead. We would use this stack again for a small, testable local service.

## Sites, Cloudflare Workers and D1

Sites deploys the bundled Web Standards Worker and provisions D1. D1 stores isolated fictional households with optimistic revision checks; a random HttpOnly cookie identifies a browser demo session. Sessions expire after 48 hours. Native deployment status and anonymous browser tests provided separate evidence of publication and correct operation.

Local tests did not expose that the hosting gateway reserves /mcp. The first public planning call failed because it did not reach our Worker. Moving the standalone protocol endpoint to /api/mcp fixed it; the public workflow was then retested. Clearer reserved-route documentation would help. Cloudflare also injects a script into HTML; a per-response CSP nonce resolved the resulting console violation without permitting arbitrary inline scripts. These are hosting integration observations, not Amazon API defects. We would use this hosting approach again for a bounded demo with small durable state.

## esbuild

esbuild bundles the official SDK, domain rules and embedded UI assets into one Worker entrypoint. It made the deployment reproducible without introducing a second product implementation. The local disk adapter needed a build-time compatibility layer because hosted persistence uses D1. We would reuse the bundler and keep the domain logic shared.

## Playwright and axe-core

Playwright tests the full repair and recovery flow in real Chrome, as well as independent hosted visitors and public HTTPS behavior. axe-core checks rendered WCAG A/AA rules at representative states. Automated assertions caught a test harness race around asynchronous review visibility; waiting for the real visible state fixed it. These tools are useful again, but their checks do not replace human layout and interaction review. We inspected desktop, mobile and recorded frames separately.

## Codex

Codex assisted implementation, review, tests, UI refinement, documentation and the demo workflow. The product does not call Codex or another language model at runtime. Before/after tests, browser evidence, deployment status and public checks were used to distinguish generated proposals from observed results. We would use it again with explicit evidence boundaries.

## Kokoro and FFmpeg / FFprobe

Kokoro af_heart supplies locally generated stock synthetic English narration. FFmpeg combines the actual UI recording, normalized audio and single-line captions; FFprobe checks streams, dimensions and duration. We did not clone a person's voice, use third-party music or generate fake product screens. Earlier preparation tried Windows speech and an online voice service; neither is the current v3 narration. Native Windows path encoding and video synchronization needed explicit handling. We would reuse this local pipeline, with frame and audio checks before publication.

## Onboarding and observed limits

Dependency installation initially encountered a local DNS restriction; an authorized network retry succeeded. The rules page required a different supported reader after a challenge blocked Jina. Browser account verification and file attachment access affected publication preparation. Those issues are not presented as Alexa latency, reliability or adoption findings.

The current YouTube upload succeeded after the participant completed Google identity verification. Its public status and 91-second duration were checked without supplying login cookies. Event registration remains a separate process and no final submission is claimed.
