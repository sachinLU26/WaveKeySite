# WaveKey messaging — options to choose from

Nothing here is applied to the site. Pick per slot and I'll implement.

---

## Part 1 — the three findings that matter more than wording

### 1. Your strongest differentiator is not on the site at all

The deck's Government Backed slide says WaveKey was assessed across **"cloud,
local network and air-gapped environments."**

That is the answer to "why isn't this just another MFA," and it is currently
nowhere on the page. Passkeys, push MFA, Google DBSC and every IdP-side
control need a network path. An ultrasonic channel between two devices in a
room does not. On an OT floor, a CNI site, or a disconnected lab, most of the
competitive set simply cannot run.

That is a category difference, not a feature. Everything else in this document
is secondary to putting it on the page.

### 2. You cut the wrong statistics

Currently live: `$23.4bn` identity spend and `20.9%` zero-trust CAGR.
Currently removed: `0` login attempts required, and `0` products covering both.

Those market-size numbers are **investor stats on a buyer's page**. A security
lead reading "$23.4bn worldwide identity spend" learns nothing about whether to
book a call. The two zeros were the ones carrying a product argument:

- **0 login attempts** — the single sharpest expression of your whole thesis.
  The attacker never touches your MFA. It is the reason a better login control
  doesn't help.
- **0 products covering both** — the only market number that says something
  about the *product* rather than the sector.

My recommendation: cut both Gartner figures from the public page (keep them in
the deck, where they belong), restore both zeros.

### 3. A partner-name discrepancy worth checking before anyone else spots it

Your deck names **One Identity (by Quest)** as the ACTIVE strategic partner.
Your marquee shows the **OneLogin** logo. Quest acquired OneLogin in 2021, so
they are related brands, but they are not interchangeable in a partnership
claim. An identity-sector investor will know the difference immediately.

Also worth resolving: "Working with" is currently doing one job for six very
different relationships — a funder (Innovate UK), an accelerator (Barclays
Eagle Labs), a strategic partner, a delivery partner (PA Consulting), and two
others. Label options are in Part 3.

---

## Part 2 — Hero

### Badge (currently "Presence assured security")

| | Option | Optimises for |
|---|---|---|
| A | **Presence-verified session** | Says what state the product maintains |
| B | **Session live · presence confirmed** | Reads as live telemetry, matches the field animation behind it |
| C | **Continuous presence MFA** | Names the category outright |

### Headline (currently "An inaudible signal that protects the sign-in, the session and every sensitive action.")

**Option A — position against MFA rather than as MFA**

> Your MFA protects the login.
> WaveKey protects everything after it.

Directly answers "is this just another MFA." Sacrifices the ultrasonic
mechanism, which the sub-line then has to carry.

**Option B — coverage as the claim**

> One factor. Three checkpoints.
> Sign-in, session and every sensitive action.

Compact, structural, matches the three stages in "How it works." Leaves
mechanism entirely to the lead.

**Option C — mechanism plus coverage (closest to current)**

> A signal above hearing that keeps proving you are there — at sign-in,
> through the session, and at every sensitive action.

Most complete, longest, most likely to break awkwardly across lines.

My pick: **A**, with the mechanism in the lead beneath. It is the only one of
the three that reframes the category instead of competing inside it.

### Lead (currently "The phone in your pocket emits a tone above human hearing…")

**Option A — mechanism first**

> Your phone emits a tone above human hearing. Your laptop listens for it.
> Access holds while you are there, and stops the moment you are not.

**Option B — consequence first**

> A stolen session token is worthless without the person it belongs to.
> WaveKey ties the live session to a signal only your phone emits, and only
> your laptop can hear.

**Option C — friction first**

> One tap starts the session. Nothing after that: no codes, no prompts, no
> approvals. The session simply ends when you walk away.

B is the strongest for an investor. C is the strongest for a buyer, because
friction is what actually kills MFA rollouts.

### Small line (currently "Ultrasonic MFA · Passive, on-demand authentication")

- A: **Ultrasonic MFA · Passive, on-demand · Works offline**
- B: **Ultrasonic · Phishing-resistant · Trusted device · No network required**
- C: **One tap per session. No codes, ever.**

A or B put the offline capability in front of the fold, which is the point of
finding 1.

---

## Part 3 — "Working with" banner

Six logos, one vague label. Options:

- **A — split into two rows with honest labels:**
  "Backed by" (Innovate UK, Barclays Eagle Labs) and
  "Partners" (One Identity, PA Consulting, Sprintworks, Parker Neal)
- **B — one accurate umbrella:** *"Partners, investors and programmes"*
- **C — lead with the strongest:** *"Funded by UK Government · Delivered with
  PA Consulting"* as a line of text, with the logo strip beneath it unlabelled

**"Trusted by" is the one label I'd avoid.** It implies all six are customers.
Innovate UK is a funder and Barclays Eagle Labs is an accelerator; if either
sees the page, that is an awkward email. Get written sign-off for each mark
regardless of the label you choose.

---

## Part 4 — How it works

You have commented out the "What it stops" lists. I would restore them. Those
lists were the entire substance of the section: three headings with one line
each says WaveKey exists, but not what it defends. **"Session hijacking /
stolen cookies and tokens / walk-away takeover" is the concrete answer to "not
just another MFA,"** and it costs three short lines.

### Section heading (currently "Invisible authentication, whenever the system needs it.")

- A: **Invisible authentication, whenever the system needs it.** (keep — it is
  the deck's line and it is good)
- B: **Authentication that never stops checking.**
- C: **Three checkpoints, one signal, no prompts.**

### The three stages — tighter versions

| Stage | Current | Suggested |
|---|---|---|
| 1 | "WaveKey being active grants frictionless access to every enabled service." | **"One tap signs you in to every enabled service. No codes, no push approvals."** |
| 2 | "The session ends when the device leaves and the signal stops." | **"The signal stops when you walk away. So does the session."** |
| 3 | "Payments, data exports, settings changes. Any action can be checked." | **"Payments, exports, config changes. Re-verified silently, with no prompt."** |

Stage 2's suggested version is the sentence I would put on a billboard.

---

## Part 5 — The problem

### Heading (currently "Attackers don't break in. They hijack trusted sessions.")

- A: keep as is — it is the sharpest line on the site
- B: **They don't beat your MFA. They arrive after it.**
- C: **Nothing was hacked. Someone just resumed your session.**

B and C both make the "your existing control was not defeated, it was
bypassed" point more explicit, which is the argument that makes a buyer who
already has MFA keep reading.

### Body (currently four one-liners — these are working, only small trims)

**Option A — keep structure, sharpen the close:**

> A sign-in proves who was at the keyboard for one moment.
> After that, the session is just a token that can be copied and reused.
> Attackers steal those tokens instead of attempting a login, so passwords and
> MFA never come into it.
> WaveKey closes that gap.

**Option B — three lines, add the friction angle:**

> A sign-in proves who was at the keyboard for one moment. After that, the
> session is just a token that can be copied and reused.
> Attackers steal those tokens rather than attempting a login. Your MFA is
> never challenged, because it is never reached.
> And the stricter you make the login, the more people find ways around it.
> Friction is why controls get bypassed from the inside too.

B is longer but reintroduces the insider-friction point, which is the argument
that lands with the person who has to *deploy* this, not just buy it.

### Statistics — my recommendation

**Keep:** `8.6bn` stolen tokens, `82%` no malware.
**Restore:** `0` login attempts required — with the note *"The attacker never
touches your MFA. There is nothing for it to challenge."*
**Cut from the public page:** `$23.4bn` and `20.9%`. Move to the deck.
**Restore in their place:** `0` products covering both login and session.

That gives you three figures that all say the same thing from different
angles, instead of five that say three different things.

### The sub-heading (currently "No MFA exists that continuously protects sessions as effortlessly as it protects sign-ins.")

- A: keep — it is accurate and it is the positioning claim
- B: **Every other control covers the login or the session. Never both.**
- C: **Passkeys cannot prove presence. Nothing on the market does.**

B is the deck's own line from the Exit slide and it is the cleanest. C is
sharper but is a stronger claim — see Part 8.

---

## Part 6 — Two sections you are missing

### A. Why it's different (the competitive answer)

Right now nothing on the page answers "I already have passkeys, why do I need
this." The deck's competitive table does, and it compresses to four rows:

> **Traditional MFA** — a code every login. Beaten by phishing and relay.
> **Passkeys and FIDO keys** — strong at the login. The session is still
> stealable afterwards.
> **Facial recognition** — checks at the login. Camera every time, and
> deepfakes are catching up.
> **Google DBSC** — silent, but it is not MFA, and it needs the malware not to
> already be on the device.
> **WaveKey** — one tap per session, then continuous presence, on both sides
> of the login.

Even as a short list rather than a table, this is probably the highest-value
addition to the page after the government contract.

### B. Use cases (you asked for these)

Three, matching the deck's "cloud, local network and air-gapped" framing:

**Enterprise MFA**
> Sits in front of the identity provider you already run. Stronger than a code,
> lighter than a prompt, and it keeps working after the login completes.

**Developer and privileged access**
> Production consoles, deploy pipelines and admin panels re-verify silently at
> the moment of action, not once at the start of the day.

**Local network, OT and air-gapped**
> The signal travels between two devices in a room, not across a network.
> WaveKey works on isolated sites where passkeys, push MFA and cloud session
> controls have nothing to talk to.

That third one is the differentiator from finding 1. If you only add one use
case, add that one.

### C. The credibility you are not using

A short band, three facts, no decoration:

> **Funded by UK Government.** A £290k Innovate UK Contract for Innovation to
> take WaveKey from proven prototype to deployment-ready, assessed for
> critical national infrastructure.
> **Independent CREST penetration test, October 2026.**
> **Advised by** a Darktrace SVP and an NCSC cyber advisor.

For a pre-revenue security product, this outweighs every statistic on the page.
Government assessment is third-party validation that no amount of Gartner
citation substitutes for.

---

## Part 7 — Solution section

### Heading (currently "WaveKey protects both the login and the session with continuous, presence-based MFA.")

- A: keep
- B: **One factor that covers the login, the session and the actions inside it.**
- C: **Presence-based MFA. The only factor that keeps proving itself.**

### You have commented out the three pillars

Restore them, at one line each — they are the "what kind of product is this"
answer and cost almost nothing:

> **Passive, on-demand** — Authenticates invisibly whenever the system asks.
> Nothing to type, nothing to approve.
> **Presence-enforced** — A stolen credential is not enough. The person has to
> be there.
> **Software-first** — Apps, SDKs and browser plug-ins. No hardware to buy or ship.

The middle one I have deliberately rewritten away from "phishing-resistant" —
see Part 8.

---

## Part 8 — Claims to be careful with

**"Phishing-resistant"** is a term of art. NIST and CISA use it to mean
specifically origin-bound cryptographic authentication — FIDO2/WebAuthn.
Presence proximity is not that. Your deck's competitive table also puts a green
tick against WaveKey for "phishing and credential theft," which a technical
reviewer will push on: a phished credential plus a present user still
authenticates. **"A stolen credential is not enough on its own"** is defensible
and says almost the same thing. This is the claim most likely to cost you
credibility in a technical diligence conversation.

**"0 products protecting both login and session"** is an assertion with no
source behind it in the deck. One counter-example from a reviewer discredits
the whole figures block. Either narrow it ("no product we have found…") or be
ready to defend the category definition.

**"2 patents granted or pending"** is correctly hedged now and matches the deck's
Exit slide. Keep that exact phrasing; do not let it drift back to "2 patents."

**"Funded by UK Government" logo usage** has published guidelines, and UKRI
generally prohibits altering their marks — note that the version currently on
your site is my monochrome conversion, which likely breaches that. Use their
official white version.

**Every statistic on this page post-dates my knowledge and I have verified none
of them.** SpyCloud, CrowdStrike and Gartner figures all came from your slides
as given.

---

## Part 9 — If you only make five changes

1. Add the **air-gapped / no-network** capability to the hero small line and as
   a use case. It is your only true category differentiator.
2. Add the **UK Government contract** band. Highest-credibility asset you own.
3. Swap the two Gartner figures for the two zeros.
4. Restore the **"What it stops"** lists in How it works.
5. Change the headline to **"Your MFA protects the login. WaveKey protects
   everything after it."**
