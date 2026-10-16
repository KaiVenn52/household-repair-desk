# Product feedback and observed friction

Local development notes only. These are not feedback on an actual Alexa device or Amazon preview API. No production user research was performed.

## Tools and purpose

- Official `@modelcontextprotocol/sdk`: server tools, Streamable HTTP transport and an independent client for integration tests.
- Express: local app, source quote documents and review routes.
- Zod: typed tool argument validation.
- Node.js built-ins: local storage, task IDs and test runner.
- Playwright and axe-core: rendered workflow and automated accessibility verification.
- Codex: implementation assistance. The app does not call Codex or another model at runtime.
- Microsoft System.Speech / Microsoft David Desktop: offline English narration for the actual product recording. FFmpeg/FFprobe: audio normalization, captions, encoding and media verification. These are preparation tools, not app runtime integrations.

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

## Additional observed preparation issues

- v0.2: browser planning and availability invoke the official MCP client over actual Streamable HTTP. Completed tool receipts are available from local /api/mcp-activity; runtimeModelConnected remains false.
- v0.2: replaced Windows David narration with local Kokoro af_heart stock neural speech. No clone or paid API is used. Unicode Windows paths required an ASCII subst drive for the native phonemizer. This is a preparation compatibility issue, not an Alexa defect.
- v0.2: encoder tail padding made total-duration-based trimming inaccurate. A discarded visual slate now locates the start in encoded frames for synchronization checks.

- Linux CI exposed a race in the test harness: checking dialog visibility immediately after the trigger click sometimes ran before the asynchronous review request finished. Using Playwright's waiting visibility assertion fixed the test. The actual app continued showing its pending state until the request completed.
- Fixed-date samples would expire before the judging period. New tasks now generate next-week example slots and preserve their calendar snapshot; a regression test covers the November judging date without changing older tasks.
- Online Edge TTS returned HTTP 403. The delivered narration uses the installed Windows voice offline instead.
- The connected Chrome Browser Bridge refused the YouTube file-selection operation (`Not allowed`). The standard uploader and account were accessible, but no successful media attachment or public YouTube video is claimed. This is a preparation/tool-access issue, not an Alexa SDK failure.
