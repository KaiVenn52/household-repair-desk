# Refinement review — 2026-10-16

## Product judgment

The original workflow demonstrated report, compare and approve. The stronger story is what happens after approval when the household's circumstances change. The implemented differentiator is a stateful repair plan whose consent expires when its underlying availability changes.

This is a product hypothesis, not validated demand or a prediction of winning. No interviews, active users, savings or real contractor outcomes are claimed.

## Changes and verification

| Finding | Implemented refinement | Evidence |
|---|---|---|
| Sorting by subtotal disguises missing scope | Budget planner excludes quotes with unknown parts costs; $140 blocks, $150 permits the $145 complete fixture | planning tests; recorded budget scene |
| A household member can become unavailable after approving | Withdraw affected pending or approved plan; archive history; require a new proposal and fresh consent | old-token rejection tests; Sam-to-Alex browser flow |
| Browser demonstration did not itself prove MCP usage | Planning and availability routes invoke the official SDK client over Streamable HTTP | HTTP integration test; runtime receipt endpoint and video |
| Intro and history competed with the current decision | Compact active-task header, three recent conversation entries, expandable history | responsive screenshots; browser flow |
| Availability button accidentally matched legacy slot handler | Require both provider and slot for manual proposal handler | browser console clean after complete replan |
| Long mechanical narration weakened the demonstration | Rewrite into eight short conversational scenes; local stock neural voice; full 16:9 real footage and short white outlined captions | v2 timeline, recording and verification JSON |

## Iteration record

1. Implement budget and availability constraints; verify stale approval rejection in domain tests.
2. Route browser planning through actual MCP; verify completed tool receipts.
3. Run desktop/mobile workflow and accessibility scans; fix focusable scroll regions and accidental double handler.
4. Shorten conversation/history so the current household decision remains visible.
5. Replace old narration with locally generated Kokoro af_heart. This is disclosed synthetic speech, not a human recording or cloned voice.
6. Record the actual two-approval workflow and inspect rendered frames before delivery.

## Remaining technical limitations

Deterministic fixtures, one demo household and one Node process. No LLM, Alexa device connection, authenticated users, external calendars, arbitrary quote extraction or contractor integration. Demo role names are not identity verification. Known price means the fixture's stated standard-seal scope, not a guarantee against real-world extra work.

## Reproduce v2 video

Application dependencies remain independent of optional video tools. Video uses FFmpeg/FFprobe, Playwright and Python kokoro-onnx 0.6.1 plus soundfile. Engine source: https://github.com/thewh1teagle/kokoro-onnx (MIT). Model: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0); model files are excluded from source distribution.

Place kokoro-v1.0.onnx and voices-v1.0.bin under video/models. Narration script verifies model SHA-256. On Windows with a Unicode workspace, use an unused temporary ASCII subst drive to this project and run the script through that drive; phonemizer resolves native paths otherwise. Remove the mapping after rendering. Then run node scripts/record-demo-v2.mjs and python scripts/render-demo-v2.py from the project directory. Video data, model weights and the isolated voice environment are excluded from Git and the source archive.
