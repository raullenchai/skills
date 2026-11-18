# skills

A personal collection of [Claude Code](https://claude.com/claude-code) skills, hand-crafted by
**Raullen** ([@Raullen](https://x.com/Raullen)) out of real problems in his own day-to-day work.
Each skill is something he built for himself first, used for real, and then cleaned up to share.

More skills will be added over time — each one is a separate plugin you can install on its own.

## Install

Add the collection once:

```
/plugin marketplace add raullenchai/skills
```

Then install the skills you want:

```
/plugin install adjacent-possible@raullenchai-skills
```

## Skills

| Skill | What it does | Status |
|---|---|---|
| [adjacent-possible](#adjacent-possible) | Break out of your **X (Twitter) filter bubble**: prune noise, keep relationships, follow verified accounts one step outside what you already see | v0.1 |
| *more coming* | | |

---

## adjacent-possible

**A skill for breaking out of your filter bubble on X (Twitter).**

> *The adjacent possible* — Stuart Kauffman's term for everything one step away from where you are:
> reachable, but not yet explored.

Recommendation feeds keep showing you more of what you already like. After a while that is all you
see. This skill moves your X graph **one step outward** — not to random topics, but toward what *you*
say you want to understand — and it does it from your own browser, at a human pace.

### What happens

```
1 Collect   Claude reads your recent posts and who you follow (your logged-in Chrome, read-only)
            → a two-line diagnosis of your bubble
2 Ask       "If your feed could teach you one or two new things this year, what would they be?"
3 Prune     Followed accounts sorted into noise / sources / relationships.
            Relationships (your company, partners, investors, friends) are kept by default.
4 Expand    4–8 accounts per thing you want to learn, each verified as real and still active,
            each with one line on why it connects to you — plus a few long-form entry points
5 Apply     Dry run first, then follow/unfollow in small batches at human speed
6 Check     (optional) two weeks later: did the feed actually change? expand one more ring
```

You spend about five minutes choosing. Claude does the reading, sorting, verifying and clicking.

### Requirements

- Claude Code with [Claude in Chrome](https://claude.ai/chrome) connected
- Chrome logged in to the X account you want to rebalance

Then say something like *"my X feed is an echo chamber, help me break out"* or run `/adjacent-possible`.

### Safety

- Runs entirely in your own browser tab. No passwords, no cookies, no private APIs, nothing sent
  anywhere by the script.
- Nothing is followed or unfollowed until you approve the exact list and see a dry run.
- Human pace: at most 20 actions per run, 15–35 s apart, and it stops if X shows a limit warning.
  Keep it under ~100 actions a day.
- A keep-list protects accounts you never want touched.

Automating clicks on X is your own call under X's terms of service; this tool is built to behave
like a careful person, not a bot farm.

### Without Claude

[`xedge.js`](plugins/adjacent-possible/skills/adjacent-possible/scripts/xedge.js) also works by hand:
open X, paste it into DevTools → Console, then

```js
// on https://x.com/<you>/following
xEdge.start('following'); /* wait */ xEdge.status(); copy(xEdge.result(0, 9999))

// follow / unfollow, dry run first
xEdge.start('apply', { follow: ['someone'], unfollow: ['noise1'], keep: ['friend'], dryRun: true })
xEdge.result(0, 50)
```

The judgement parts — what to cut, what to add — are what the skill brings.

## License

MIT
