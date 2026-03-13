# devroast

> Paste your code. Get roasted.

**devroast** is a tool that gives your code a brutally honest quality score. Drop in any snippet and get an AI-powered roast — a numeric rating, a savage one-liner, a breakdown of what's wrong (or right), and a suggested fix shown as a clean diff.

---

## Features

### Code Roasting
Paste any code snippet into the editor and hit **roast my code**. Toggle roast mode on for maximum villainy, or keep it off for a gentler review.

### Quality Score
Every submission gets a score from **0 to 10** displayed as a circular progress ring — the lower the score, the worse the shame.

### Roast Quote
A brutally honest one-liner summarizing the state of your code. No sugarcoating.

### Detailed Analysis
Each submission generates analysis cards flagged as:
- 🔴 **critical** — things that will hurt you
- 🟡 **warning** — things that should be fixed
- 🟢 **good** — the rare things you got right

### Suggested Fix
A git-style diff showing exactly how the code should be rewritten, line by line.

### Shame Leaderboard
The worst code ever submitted, ranked by score. A public hall of shame for the ages.

---

## Routes

| Route | Description |
|---|---|
| `/` | Home — paste code and submit for roasting |
| `/results` | Your roast results — score, quote, analysis, and diff |
| `/leaderboard` | The full shame leaderboard |
