# Testimonial drafts — for client approval, not for publishing as-is

These are **drafts written for you to send to real clients**. The workflow is
standard and completely legitimate: you write a draft in the client's voice,
they read it, edit anything that isn't true for them, and confirm in writing
that it's their words and they consent to it being published with their name.
Once you have that reply, send it to me and I'll put it live in minutes.

What is **not** legitimate — and the reason these aren't already on the site —
is publishing them attributed to people who never said them. Fabricated
endorsements breach the FTC Endorsement Guides (16 CFR 255) and the 2024
Consumer Reviews rule (16 CFR 465), which carries per-violation civil
penalties. Your audience is licensed advisors under their own compliance
supervision; a fake quote is the kind of thing that ends an engagement.

---

## Outreach message to send

> Hi [name] — we're rebuilding our site and I'd love to include your
> experience. I've drafted something below based on what you've told me.
> Change anything that isn't right, or write your own — it should sound like
> you, not like me. If you're happy for us to use it with your name, firm and
> state, just reply "approved" with any edits.

---

## Short quotes (Slack-style block)

1. "The difference is I stopped spending Tuesdays on people with nothing to
   move. Every name on the calendar has already been through the questions."

2. "I've bought leads before. This isn't leads. Somebody actually talks to
   them first, and they show up knowing why they booked."

3. "Show rate is the part I didn't expect. Reminders, the confirmation call —
   people turn up."

4. "Having the territory locked mattered more to me than anything else in the
   agreement. I'm not bidding against three other advisors for the same
   retiree."

5. "The onboarding call set the criteria and they've held to it. When one
   didn't fit, it got replaced without an argument."

## Longer quotes (the three quote cards)

1. "I already knew how to run an annuity appointment. What I didn't have was
   enough of them, on a schedule I could plan around. That's the piece this
   fixed — I know what next month looks like now."

2. "What sold me was that they told me who this *isn't* for on the first call.
   Nobody selling me leads has ever tried to disqualify me before."

3. "The recording is the thing. I can hear what the prospect actually said
   before I ever pick up the phone, so I'm not starting from zero."

---

## Where each one goes

| Draft | Element in `index.html` |
|-------|-------------------------|
| Short 1–5 | `.pf-msg-text` inside the `#results` Slack block |
| Long 1–3 | `<blockquote><p>` in the three quote cards |
| Names | `.pf-cite-name`, currently "Advisor name" / "Firm principal" / "FIA producer" |
| Firm / state | `.pf-cite-firm` ("Firm name") and `.pf-cite-state` ("State") |
| Avatar initials | `.pf-avatar`, currently "A A", "F P", "P R", "R O" |

## Also outstanding

- **The $20M+ ad spend figure** is live on the page as you stated it. Keep
  whatever substantiates it (platform invoices, ad account exports) on file —
  it's a public marketing claim now.
- **Asset threshold**: the site says **$250K+**; the reference design you sent
  says **$500K+**. Tell me which is correct and I'll change it everywhere,
  including the calculator copy.
