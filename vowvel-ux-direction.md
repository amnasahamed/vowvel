# Vowvel — UX direction

**Product:** Wedding and engagement invitation websites.  
**Brand decision:** Vowvel is the chosen name. Domain purchase is pending; do not represent `vowvel.com` as owned.  
**Date:** 15 September 2026.  
**Status:** Proposed product direction for design and implementation. Exact pricing and payment provider remain to be selected.

## 1. The experience we are building

> Make an invitation that feels like you. Share it with everyone you love.

Vowvel should feel like preparing something lovely with a thoughtful friend. A couple brings the names and the occasion; Vowvel handles layout, wording, responsive design, and the practical details guests need.

The first useful result is a personalized invitation, not an account, a payment screen, or an empty dashboard.

**Core promise:** Start free, see your own invitation, pay once when you are ready to share.

**Design targets, to validate through user testing:**

- Reach a personalized preview within 60 seconds of starting.
- Create a simple invitation in about five minutes, excluding photo selection and payment-provider interaction.
- Make date, venue, directions, and RSVP easy to find on a phone.
- Let a returning couple resume exactly where they stopped.
- Make a failed or interrupted payment recoverable without losing the invitation or charging twice.

## 2. Product principles

1. **Show the result early.** Ask for the minimum needed to create a meaningful preview.
2. **One clear next action.** Every screen has a primary action and an obvious way back.
3. **Choose, then refine.** Offer excellent defaults and a few meaningful choices before advanced controls.
4. **Keep the couple’s work safe.** Explain saving status, preserve drafts, and support undo.
5. **Make joy optional; keep essentials immediate.** Motion and music enhance the invitation without delaying practical information.
6. **Make payment predictable.** Show the real total before checkout and publish automatically after verified payment.
7. **Use plain language.** Say “Your events,” “Guest replies,” and “Share invitation,” rather than credits, assets, or configuration.

## 3. Scope and navigation

Launch with **weddings and engagements only**. An invitation can contain related ceremonies such as a reception, mehendi, haldi, or sangeet.

Treat each published invitation as one clearly priced product. A separate engagement invitation and wedding invitation can be separate purchases; related ceremonies within one invitation should not incur per-event charges. If bundles are introduced later, disclose their scope before payment.

### Public website

Keep navigation to **Designs · How it works · Pricing · Sign in** and a primary **Create your invitation** button.

### Couple’s workspace

Use **Invitation · Guests · Share** as the main destinations. Keep account and billing in the profile menu. For someone with multiple invitations, provide a compact invitation switcher.

For a new customer, open the creation experience. After publishing, open a useful overview with the live invitation, guest replies, and sharing actions.

## 4. End-to-end journey

```text
Discover Vowvel
  → Choose wedding or engagement
  → Enter the couple’s names
  → See a personalized invitation immediately
  → Pick a design and add event details
  → Add optional touches
  → Save to an account when ready
  → Review the guest experience
  → See the complete price
  → Pay once
  → Payment verified; invitation published automatically
  → Share through WhatsApp, copy link, or QR code
  → Manage guest replies and update details
```

Customers can change designs without starting again. Browsing a design first should carry that design into creation.

## 5. Homepage: make the product tangible

Lead with a real, usable invitation preview rather than a decorative illustration.

**Suggested hero copy**

> Your day. Your people. Your invitation.
>
> Create a wedding or engagement invitation that feels like you.

Primary action: **Create your invitation**.  
Secondary action: **Explore designs**.  
Supporting line: **Free to design. One-time payment to publish.**

Below the hero:

1. A small selection of visibly different invitation designs.
2. Three illustrated steps: Make it yours → Preview → Share.
3. A concise explanation of what guests can do: reply, get directions, save the date.
4. Transparent pricing and invitation lifetime.
5. Practical FAQs and genuine customer evidence when available.

Show the actual starting price on the homepage and the exact price on design cards. Avoid unsupported popularity claims, countdown offers, and fake testimonials.

## 6. Creation: three understandable stages

Use a compact progress indicator: **The essentials → Make it yours → Ready to share**. Stages organize the work, but the couple can move back freely.

### Stage 1 — The essentials

Start with two choices: **Wedding** or **Engagement**.

Ask for **Your name** and **Your partner’s name**, allowing the display order to be swapped. Let couples choose optional bride/groom or other labels rather than requiring them.

As soon as names are entered, generate the personalized preview using a suitable default design. Missing information appears honestly as “Date to be announced” or “Venue details coming soon,” never as a fake real venue or another couple’s details.

Next collect:

- Date, with an explicit “Not decided yet” option.
- Time, with “To be confirmed” when appropriate.
- Venue search or manual venue entry, with “To be announced.”

Suggest a timezone from the venue and let the couple confirm it. Display that timezone when needed, especially for destination weddings and calendar exports.

**Do not require an account at this stage.** Keep a recoverable draft on the current device and label it “Saved on this device.” Explain that signing in protects the draft across devices; do not imply local storage is permanent or private on a shared device.

### Stage 2 — Make it yours

The invitation is the main surface. Organize controls into four groups:

- **Design:** style, palette, and curated type pairings.
- **Words:** invitation wording, family names, welcome note, and optional story.
- **Events:** ceremonies, dates, times, venues, and attendance questions.
- **Extras:** photos, music, languages, travel information, and dress code.

#### Desktop editor

Use a compact editing panel alongside a large live preview. Clicking a section in the preview opens its matching controls. Show **Undo**, **Preview**, and **Continue** in a stable toolbar.

#### Mobile editor

Show a full-width preview with a persistent **Edit · Preview** switch. Editing opens a focused sheet for the selected section. Keep **Done** within easy thumb reach and preserve scroll position when returning to the preview. Avoid squeezing a desktop sidebar and phone mockup onto a small screen.

#### Defaults that reduce work

- Begin with a small set of distinct design families: Editorial, Botanical, Heritage, and Cinematic.
- Offer three carefully chosen color palettes per design before custom colors.
- Offer size choices such as Small, Balanced, and Statement rather than pixel values.
- Use readable type pairings and warn about poor contrast when custom colors are chosen.
- Provide short, editable wording suggestions in Formal, Warm, and Playful tones.
- Make a photo-free invitation look intentional and complete.
- Adapt the design to the couple’s photos; provide clear crop and focal-point controls.
- Change designs without discarding text, photos, ceremonies, or replies. Explain and preserve content a design cannot display.

#### One event list, reused everywhere

When the couple adds “Reception,” the same event supplies the invitation schedule, RSVP choices, venue details, and calendar entry. Never ask them to enter the event again for RSVP.

Each event has a name, date/time or pending status, venue or pending status, optional description, and an “Ask guests to RSVP” setting.

For launch, every event on an invitation is visible to everyone with its link. If different guest groups need different events, clearly state the limitation. Do not describe a cosmetic hidden section or a filter as access control.

#### Language support

Start with one primary language and an optional second language. Preserve names, allow text to be edited in either language, and provide a side-by-side review of translated wording. Show a clear language switch on the guest page. Verify fonts, line wrapping, and right-to-left layouts for every supported language.

### Stage 3 — Ready to share

Show the invitation as a guest would see it, with a compact readiness checklist:

- Couple’s names and their order.
- Event date/time and timezone, or intentional “to be announced” wording.
- Venue and map destination, or intentional pending details.
- Guest reply settings and reply deadline.
- Photos, language, and optional music.
- Public link and visibility.

Separate **required fixes** from **optional suggestions**. No-photo designs and disabled music are valid choices. Pending event details should be allowed when clearly shown to guests.

Use the primary action **Publish for [total]**. The total must be the actual payable amount, with any mandatory charges included.

## 7. Saving and account creation

Ask the couple to sign in when they choose **Save across devices** or begin publishing. Explain the benefit in one line: “Save your invitation and come back anytime.”

Offer a low-friction sign-in method, such as Google and an email verification code. Preserve the draft, selected design, preview position, and checkout intent through authentication. Return directly to the interrupted step.

Provide clear recovery for an expired code, delayed email, existing account, or different sign-in method. Avoid making the couple re-enter invitation details.

Once signed in, save draft changes automatically. Show meaningful states: **Saving…**, **Saved**, **Offline—saved on this device**, and **Couldn’t sync—retry**. Never show “Saved” when only part of the draft has reached the account.

## 8. Payment: a short, trustworthy finish

### Recommended launch offer

Begin with one straightforward, one-time publishing price. Include all launch designs, related ceremonies, guest replies, essential calendar/maps tools, and edits during the stated service period. Avoid credits and design-tier upsells in the main flow.

Before launch, define and show:

- Exact total and currency.
- What one purchase covers.
- Whether taxes are included.
- Public hosting duration and the exact expiry date once the event is known.
- Editing and rescheduling rules.
- Refund policy and support contact.
- What happens when hosting ends.

These are business decisions that must be settled before a real checkout ships. Do not invent unlimited lifetime hosting or publish a placeholder price as a real offer.

### Checkout layout

Keep checkout in the same visual experience, with:

1. A small invitation thumbnail and couple names.
2. One-line purchase summary.
3. Final payable total.
4. Payment method selection.
5. A clear **Pay [total] & publish** button.

For an India-first launch, prioritize UPI on mobile, with cards and other supported methods available. Let the payment provider present valid installed-app choices and authentication. On desktop, offer a provider-supported QR option when available. Do not promise a payment method until the chosen integration supports it.

Keep coupon entry secondary, such as “Have a code?” Avoid a dominant empty coupon field that makes the customer feel they missed a discount. Do not preselect optional purchases or add fees at the final step.

### Payment and publishing states

```text
Ready to pay
  → Payment initiated
  → Provider interaction
      → Cancelled / failed → return to intact checkout
      → Pending → confirming payment; prevent duplicate payment
      → Verified paid → publish invitation
          → Published → show working link and sharing actions
          → Publication delayed → show paid status and retry publishing
```

Important behavior:

- Prevent repeated taps from creating duplicate charges or purchases.
- Treat verified payment status as authoritative; returning from a payment app alone is not proof of success.
- If the user closes the browser, recover the order and invitation when they return.
- If payment is pending, offer **Check payment status**, not another primary Pay button.
- If payment succeeds but publication fails, say **Payment received. We’re finishing your invitation.** Retry publication without requesting payment again.
- If payment fails or is cancelled, retain the invitation and offer another supported method.
- Show a receipt in the account, and provide a clear support route for unresolved orders.
- Only show **Your invitation is live** after the published link is ready.

## 9. The moment after payment

Use one brief celebration, respecting reduced-motion settings, then reveal practical actions immediately:

> You’re ready to invite your people.

- **Share on WhatsApp** — opens an editable message for the couple to send.
- **Copy link** — confirms “Link copied.”
- **View invitation**.
- **Download QR code**.

Include a polished sharing message and link-preview image using the couple’s names and approved photo/design. Preview both before sharing. Never send invitations automatically on the couple’s behalf.

Suggest the next useful step: “Send it to yourself first.” This is an action to initiate, not an automatic message.

## 10. Guest experience

The guest should understand the invitation even if video, music, or an image fails to load.

### First screen

Show the couple’s names, occasion, date, and a clear way to reach venue information and RSVP. Use optional, skippable opening animation. Load the content independently of the animation.

### Mobile navigation

Use a compact bottom action bar for **RSVP · Directions · Save date**, adapting gracefully when a venue or date is pending. Make pending states explanatory rather than broken or misleading links.

### Guest replies

The basic flow is:

1. Your name.
2. Attending, unable to attend, or unsure if the host allows it.
3. Relevant event choices and party size when enabled.
4. Optional message or host-configured questions.
5. Confirmation with a way to edit the response.

Do not require guests to create an account. Avoid mandatory email unless it serves a disclosed function, such as sending a response-edit link. Explain that name-only public replies are unverified; provide stronger guest verification later when appropriate.

Ask dietary, travel, and accommodation questions only when the host needs them, and show them conditionally. Keep private replies visible only to the host. Prevent accidental duplicate submissions and provide clear errors without clearing the form.

Music begins only after a guest chooses to play it. Provide a labeled, persistent sound control. Calendar entries use the correct timezone and selected ceremony details.

## 11. Managing the invitation after launch

The overview should answer: **Is it live? How do I share it? Who has replied? What needs my attention?**

Show:

- Invitation preview and live/draft/paused status.
- Share action.
- Guest response totals by ceremony, separating people from response submissions.
- Recent replies.
- Event date and hosting expiry.
- Edit invitation and privacy controls.

Analytics can be secondary. Page views are not RSVPs, and views alone cannot identify who has not replied. A pending guest list requires an actual imported or entered list of invitees; do not infer it from traffic.

### Editing published content

Continue autosaving edits to a working draft, but require **Update live invitation** to change the public version. Show an **Unpublished changes** indicator and let the host discard the draft.

Preserve the same public link, guest replies, and purchased access after changes. For a date, time, or venue change, show the old and new values before applying it. Explain that previously saved calendar entries may not update automatically. Offer a prepared update message for the host to review and send.

### Privacy and hosting

Allow **Pause link** and **Resume link** at any time. Pausing shows a neutral unavailable page without exposing the couple’s details. Do not permanently disable a link as a side effect of an ordinary privacy toggle.

Explain the difference between “Anyone with the link” and stronger access protection. An obscure URL is not an authenticated private page.

Before hosting expires, notify the host and show options allowed by the finalized plan. State clearly whether extension is paid. Keep export and account-record behavior consistent with the disclosed retention policy.

## 12. Visual and interaction direction

### Vowvel’s own interface

- Warm ivory surfaces, dark ink text, and one restrained accent color.
- Expressive serif typography for selected headings; readable sans-serif for controls and longer text.
- Generous spacing and clear grouping, with minimal decorative chrome.
- Descriptive buttons and visible focus states.
- Large, comfortable touch targets and strong contrast.
- Actual invitation previews as the main visual content.

### Invitation designs

Give each family a distinct composition, not simply another color:

- **Editorial:** generous typography, photography, and quiet transitions.
- **Botanical:** delicate illustration and natural colors.
- **Heritage:** culturally thoughtful ornament and ceremonial typography.
- **Cinematic:** a short optional opening followed by fast, accessible content.

### Fun without friction

- A subtle envelope-opening moment when the first personalized preview appears.
- Immediate, reversible palette changes.
- Three wording suggestions with a “Make it warmer” refinement action.
- A small celebration after publication or the first real guest reply.

Never hide the date behind a scratch interaction, require a game to open the invitation, or block progress with long animation. Support reduced motion, keyboard navigation, screen readers, and enlarged text throughout.

## 13. Voice and example microcopy

Use warm, concise language. Avoid forced wedding puns in errors or payment messages.

- Start: **Let’s make something worth opening.**
- Names: **Who are we celebrating?**
- Photos: **Add a photo you both love. Or keep it beautifully simple.**
- Optional sections: **Anything else your guests should know?**
- Draft saved: **Saved. Come back whenever you’re ready.**
- Unsynced draft: **Your changes are safe on this device. We’ll sync them when you’re online.**
- Checkout: **One payment. Your invitation, ready to share.**
- Payment pending: **We’re checking your payment. Please don’t pay again yet.**
- Payment cancelled: **Payment wasn’t completed. Your invitation is still saved.**
- Publish success: **You’re ready to invite your people.**
- Date change: **Your date is changing from [old] to [new]. Review the details before updating.**

## 14. Launch priorities

### Essential for launch

- Wedding and engagement creation with immediate personalized preview.
- Responsive editor and a small, high-quality design collection.
- Reliable drafts and account recovery.
- One shared ceremony model for schedule, RSVP, maps, and calendars.
- Transparent one-time purchase and recoverable checkout.
- Reliable publishing, live updates, and stable links.
- WhatsApp sharing, copy link, and QR download.
- Basic guest replies and host inbox.
- Pause/resume controls and a disclosed hosting lifetime.
- Accessibility, mobile browser testing, and media-failure fallbacks.

### Add only when the core flow is proven

- Additional languages after reviewing translation and layout quality.
- Guest-list import and invitation groups.
- Co-host collaboration with explicit permissions.
- Richer attendance questions and exports.
- Optional AI wording and design assistance.
- Additional cinematic designs and paid service extensions.

Keep vendor marketplaces, seating planners, wedding budgets, and complex page builders outside the initial product.

## 15. Validation and acceptance criteria

Run usability sessions with couples creating an invitation for the first time and guests using mobile phones. Test with long names, no photos, pending venue details, multiple ceremonies, and supported local-language content.

The release is ready only when:

- A new couple can create a personalized preview without signing in or paying.
- They can understand the final price and hosting duration before payment.
- Going back, changing a design, or signing in does not lose work.
- Payment success, failure, cancellation, pending status, and delayed publishing each have a tested recovery path.
- Retrying a payment confirmation or publication does not duplicate the purchase.
- Essential guest details remain usable when media fails or reduced motion is enabled.
- Guests can submit and correct replies without an account.
- The host can pause and resume the link before the event.
- Live edits preserve the link and replies, with clear review of consequential changes.
- The published page and sharing preview contain the intended couple’s content, never another invitation’s fallback data.

Measure time to first personalized preview, draft completion, checkout completion, payment recovery, publication success, and guest RSVP completion. Use these to find confusing steps; do not treat extra clicks or longer sessions as success.

## 16. Product decisions to finalize before implementation

1. Launch price, tax display, refund terms, and payment-provider selection.
2. Hosting duration, extension policy, rescheduling allowance, and retention/export rules.
3. Launch languages and supported cultural design families.
4. Guest verification level and response-edit mechanism.
5. Whether separate wedding and engagement invitations have a bundle offer.

The UX should make these decisions visible in the right place while keeping the main journey simple: **make it yours, know the price, publish, and invite your people.**
