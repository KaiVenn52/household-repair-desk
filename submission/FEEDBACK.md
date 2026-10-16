# Product feedback and observed friction

Local development notes only. These are not feedback on an actual Alexa device or Amazon preview API. No production user research was performed.

## Tools and purpose

- Official `@modelcontextprotocol/sdk`: server tools, Streamable HTTP transport and an independent client for integration tests.
- Express: local app, source quote documents and review routes.
- Zod: typed tool argument validation.
- Node.js built-ins: local storage, task IDs and test runner.
- Playwright and axe-core: rendered workflow and automated accessibility verification.
- Codex: implementation assistance. The app does not call Codex or another model at runtime.

## What worked well

The official stateless HTTP example provided a small starting point. Sharing domain rules between browser actions and MCP tools avoids implementing different approval behavior for each surface. The alternate web simulation route lets this prototype demonstrate the household workflow without asserting access to a real Alexa runtime.

## What needs work

The server and browser are not yet an authenticated household product. Integrating a real assistant requires a clear identity and approval handoff; a tool response must not itself count as household consent. A future Amazon integration guide showing how a proposal becomes an explicit, auditable customer approval would help this use case.

## Onboarding

The local process starts without an Amazon account or credentials. The first sandboxed npm install failed resolving registry.npmjs.org; an authorized network-enabled retry installed the official runtime dependencies. This was an environment issue, not an SDK or Amazon service defect. Jina's rules fetch hit a 403 challenge; the official rules were read through the web tool instead.

## Would we build with these tools again?

Yes for the official MCP SDK and local web stack: they make the bounded workflow independently executable and testable. An actual Alexa+ runtime decision needs direct onboarding and device/preview testing; that experience has not happened here.

## Friction entries

| Task | Expected / actual | Severity | Workaround | Suggestion |
|---|---|---|---|---|
| Read live rules via Jina | Rules text / 403 challenge | Minor, research environment | Read official page via web tool | A downloadable dated rules file would simplify evidence capture. |
| Install runtime packages in restricted shell | Dependencies / DNS ENOTFOUND | Moderate, local environment | Authorized network-enabled install | Document network requirements; do not blame the SDK. |

Do not report hypothetical Alexa latency, device reliability, preview errors or user adoption. Add further friction only after reproducing it, with exact versions and evidence.
