# Suggesting accounts one step outside the bubble

## What "one step" means

Not random, not more of the same. A good candidate shares a **lens or underlying question** with
something the user already cares about, applied to territory they do not yet watch. Distance check:

- Too close: would already appear in their feed (same industry, same discourse, mutuals they follow).
- Too far: no thread back to anything in Phase 1 or Phase 2.
- Right: you can write one honest sentence connecting it to the user's own posts or stated intent.

## Sourcing

For each intent the user gave (their words), think in three directions and pick the best few:

| Direction | Meaning |
|---|---|
| **Lens** | Same way of thinking, different domain (e.g. "verifiable data from devices" → people discovering equations from sensor data) |
| **Roots** | The history / economics / physics underneath what they work on (e.g. progress studies, semiconductor history) |
| **Practitioners** | People doing the thing at the frontier, posting primary material (papers, builds, data) |

Prefer: researchers, builders, long-form writers, podcasters with substantive guests.
Avoid: aggregators, motivational accounts, anyone whose output is mostly links to others.

## Verification (mandatory)

Run `xEdge.start('verify', { handles })` on every candidate before showing it. Drop and report:
- `exists: no` (wrong handle, suspended, renamed),
- `lastPost` older than ~6 months, or a bio saying they moved to another platform,
- the bio clearly not matching who you thought it was.

If a handle fails, you may try one obvious alternative spelling, then verify again.

## Output shape

```
<Intent in the user's words>
  @handle — Name, what they do. Why for you: <one sentence tied to their posts/intent>.  [followers, last post]
  ...
  Long-form: <podcast / book / course / newsletter> — <one line>
```

4–8 accounts per intent, 2–3 long-form items. Then ask which to follow.
