# Classifying followed accounts

Input per account: `handle | name | followsYou | bio`. Output one of **noise / sources /
relationships / unsure**, plus a 3–8 word reason.

## Decision order

1. **Relationships first.** Keep if any of these hold — even if the bio is full of shill keywords:
   - It is the user's own company, product, foundation or ecosystem account (match names/handles
     from the user's posts and bio).
   - It is a founder, executive, investor, fund, or partner organisation in the user's industry.
   - `followsYou` is yes **and** it looks like an individual rather than a brand or bot.
   - The user has mentioned or replied to them in the posts you collected.
2. **Noise** if the account mostly *amplifies* rather than *originates*:
   - Price calls, "alpha", signals, giveaways, airdrop hunting, "100x", copy-trading.
   - Engagement farms: "Instead of Netflix, watch…", "THIS IS A GOLDMINE", thread-of-threads.
   - Generic aggregators and brand/chain/project official accounts the user does not work with.
   - Bio says the account is inactive or has moved elsewhere.
3. **Sources** if a person or outlet produces original work the user still benefits from.
4. **Unsure** for individuals you cannot place. Never default an unknown individual to noise
   without listing them — it might be a friend.

## Presenting

- Noise: grouped by reason, as a ready-to-paste array.
- Relationships: separate list with why ("CEO of a partner company", "your ecosystem account", "follows you").
- Unsure: short list; ask.
- Never show the user's full following list back to them; only the actionable parts.
