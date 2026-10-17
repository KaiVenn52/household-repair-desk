# Observed friction log

No actual Alexa device or preview API was available. The entries below concern the tooling and documentation actually used. They are not claims about Alexa device reliability or latency.

## Official MCP SDK: expected error shapes

- Task: relay the SDK client's plan_repair result to the web interface.
- Steps: report a fictional leaking sink, then POST a null or nonnumeric maxTotal to the browser planning endpoint, which calls the actual MCP tool over HTTP.
- Expected: a useful validation response without mutating the task.
- Actual: SDK schema errors returned plain-text tool content. Our adapter incorrectly assumed every error was domain JSON and produced HTTP 500. This was our integration assumption, not a claimed SDK outage.
- Severity: moderate for the prototype, because an ordinary input error appeared as a server fault.
- Workaround: distinguish SDK schema errors from structured domain errors, return a bounded HTTP 400 hint, and preserve browser input. Four invalid budget variants are regression-tested.
- Suggestion: include a client adapter example handling both schema-error text and application-level structured errors in the official SDK examples. Priority: nice-to-have.
- Versions: official MCP SDK 1.32.1, Node 24.20.0; exact dependencies locked in package-lock.json.
- Evidence: tests/recovery.test.js and docs/FINAL-AUDIT-20261017.md.

## Registration guidance: public and private source options

- Task: determine source access requirements from the official event rules.
- Expected: one clear instruction for the chosen public open-source route.
- Actual: the rules describe public open source or private reviewer access, followed by a sentence instructing the repository to be private; the next bullet again explains public license detection.
- Severity: minor documentation ambiguity.
- Workaround: retain the explicitly permitted public repository with an MIT license and clear setup; no private reviewer invitation is claimed or needed for public source access.
- Suggestion: place the private-only invitation instruction under a clearly marked private-repository subsection.
- Source checked October 17: https://amazonappdev2026.devpost.com/rules .

## Boundaries

Local DNS restrictions, stock-voice native Windows path handling and the YouTube browser bridge refusal are already documented in FEEDBACK.md as preparation/environment issues. They are not presented as Amazon service bugs. No feedback bonus or acceptance is claimed.
