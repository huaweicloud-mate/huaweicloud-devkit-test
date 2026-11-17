# Findings - Codex GPT-5

## P0 D4-19
- Expected: invalid approval token is rejected.
- Actual: fixture returned without throwing.
- Evidence: evidence/D4-19/stdout.txt.

## P0 D9-12
- Expected: invalid params return JSON-RPC -32602 and initialize declares required protocol capability.
- Actual: invalid params produced no error object; cancellation capability was absent.
- Evidence: evidence/D9-12/probe.stdout.txt.

## P1 D2-10
- Expected: missing KooCLI config reports KooCLI config not found.
- Actual: returned a longer localized message instead.
- Evidence: evidence/D2-10/stdout.txt.

## P1 EXP-E01
- Expected: Chinese ECS query routes to ECS.
- Actual: route miss.
- Evidence: evidence/EXP-E01/probe.csv.

## P2 D3-C14
- Expected: missing credentials error matches fixture contract.
- Actual: localized message differs from expected text.
- Evidence: evidence/D3-C14/stdout.txt.

No GitHub issue was created or modified in this run, per autopilot instruction.
