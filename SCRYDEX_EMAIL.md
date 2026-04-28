# TCGPlayer API Access Request — Draft Email

> **Context:** TCGPlayer (owned by eBay) stopped accepting new API applications after the acquisition.
> Exceptions are granted based on merit — a compelling app demo and business case.
> The Discord community confirms approvals still happen for strong submissions.
> Send AFTER TestFlight is live and you have a real demo video.

---

**To:** api@tcgplayer.com *(try this first — also try partners@tcgplayer.com if no response in 5 days)*  
**CC:** *(leave blank)*  
**Subject:** API Access Request — Card Valuer (iOS App, App Store Launch May 2026)

---

Hi TCGPlayer team,

I'm the developer of **Card Valuer**, an iOS app launching on the App Store this month that I believe directly complements TCGPlayer's marketplace — and I'd like to request developer API access.

**What Card Valuer does:**

Card Valuer uses on-device computer vision (Apple Vision framework) to continuously scan Pokemon TCG cards through the camera — no button press, no upload. As you hold a card in frame, it instantly identifies the name and set number, then surfaces live market pricing. The app is built for dealers working card shows, collectors sorting bulk inventory, and anyone who needs fast accurate card valuations.

Features:
- Continuous OCR scanning — identifies cards in real time without user input
- Per-condition pricing: NM / LP / MP / HP / DMG
- Graded slab scanning — PSA, CGC, BGS, SGC barcode → grade + market value
- Session tracking — scan a box of cards and see total collection value
- CSV export — dealers take a full inventory report away from a show

**Why TCGPlayer data specifically:**

TCGPlayer market prices are the industry standard that dealers and collectors trust. Pricing sourced directly from your platform — with proper attribution — would make Card Valuer the most accurate tool of its kind. I'm not scraping or proxying: I want a legitimate, attributed integration that drives visibility and traffic back to TCGPlayer listings.

**Current status:**
- iOS app in active TestFlight testing
- LLC enrolled in Apple Developer Program
- App Store submission this month
- [Demo video attached / linked]

**What I'm asking for:**

Read-only access to card catalog and pricing endpoints — specifically current market price by condition for Pokemon TCG cards. I will display TCGPlayer attribution on every price shown, consistent with your terms.

I understand new API access isn't being granted through the standard process. I'm reaching out directly because the app is real, the launch is imminent, and I believe the integration is mutually beneficial. Happy to discuss any terms, usage limits, or partnership structure that works for your team.

[Demo video link or attachment]  
[TestFlight link if available]  
Privacy Policy: https://github.com/TomLafferty/card-valuer/blob/main/PRIVACY_POLICY.md

Thank you for considering this.

Tom Lafferty  
Card Valuer LLC  
tsl5046@gmail.com

---

## Before Sending — Checklist

- [ ] GitHub repo is set to **public** (privacy policy URL must be accessible)
- [ ] TestFlight build is live on your iPhone
- [ ] Demo video recorded — 60–90 seconds showing:
  - App launch + retro intro animation
  - Scanner recognizing a real card live on camera
  - Price appearing with condition picker
  - Session tab with multiple cards + total value
  - Collection tab
- [ ] Upload demo video to YouTube (unlisted) or Google Drive and insert link above
- [ ] Try api@tcgplayer.com first — if bounces, try partners@tcgplayer.com
- [ ] Also post in TCGPlayer developer community forum at community.tcgplayer.com
  referencing the email for a second touchpoint

## Alternative if email gets no response

Post on the TCGPlayer community forum (community.tcgplayer.com) with screenshots and a link to the demo video. The Discord community says forum visibility has led to approvals — the dev team monitors it.
