# Zareqia workflow: weddings and engagements

Reviewed on **14 September 2026** through the live website, a signed-in Royal account, and one published fictional wedding invitation.

This document describes the observed Zareqia workflow. Recommendations for a competing product are outside its scope. Prices and behavior are a snapshot of the review date.

## 1. Workflow overview

```text
Homepage
  → Browse templates
  → Select invitation type and collection
  → View a sample demo (optional)
  → Use this design
  → Create account / log in
  → Dashboard
  → Purchase an invitation credit
  → Create invitation
  → Enter event details and customize sections
  → Generate Invitation Link
  → Confirm event date and time
  → Public invitation created; one credit consumed
  → Dashboard: copy/share link, view, edit, analytics, inbox
  → Editing available until the event
  → Automatic privacy transition 30 days after the event
```

There is also a direct path from the homepage’s Login link to the dashboard. For an account without credits, **Create New** and **Create Your First Invitation** lead to checkout.

## 2. Public discovery and template selection

**Entry points:** [Homepage](https://zareqia.com/), [Templates](https://zareqia.com/templates).

The homepage introduces digital invitations, shows sample designs, explains features and plans, and links to template selection and live demos.

The template catalog provides:

- An **Invitation Type** selector. Relevant options include Wedding Invitation, Engagement Invitation, Wedding & Reception Invitation, and Reception only invitation.
- **Zareqia Royal** and **Zareqia Classics** collection controls.
- Template cards with a name, description, demo link, and **Use This Design** action.

The wedding catalog displayed 13 templates across the collections: eight Royal designs and five Classic designs. The engagement catalog displayed four Royal designs and five Classic designs during the review; do not assume every wedding demo is available for engagement.

Royal names observed included Royal Imperial, Royal Heritage, Royal Majesty, Royal Grace, Royal Crest, Royal Legacy, Royal Prestige, and Royal Elegance. Classic names included Emerald Noir, Crimson Royale, Rose Gold Blush, Modern Minimal, and Majestic Love.

**Observed issue:** opening Emerald Noir from the engagement catalog led to a URL containing `type=engagement`, but the loaded invitation visibly showed a Housewarming Ceremony. This was verified after opening the invitation, rather than inferred from a loading placeholder.

## 3. Account creation and dashboard

Selecting a design while signed out opened signup with the template identifier preserved in the URL, for example:

`/signup?template=rose-gold-blush-royal`

Signup requested:

1. Full name.
2. Email.
3. Password.
4. Password confirmation.

The user completed account creation/sign-in personally. Verification steps, if any, were not inspected.

The dashboard at `/dashboard` initially showed:

- **My Invitations**.
- No invitation credits and no invitations.
- **Create New** and **Create Your First Invitation**, both leading to checkout.
- Account, Inbox, and Logout navigation.
- A notice explaining the invitation’s public lifetime and permanent privacy transition.

The observed flow required signup and purchase before reaching the personalized editor. No free personalized draft or live editor preview was found in this path.

## 4. Purchase and credit model

**Page:** `/checkout`.

### Classic — ₹1,199

The checkout listed a one-time purchase covering:

- Five Classic templates.
- One invitation webpage with edits.
- Door-opening animations.
- Guest messaging inbox.
- Background music.
- Google Maps integration.
- Ability to buy additional invitations.

### Royal — ₹1,499

Royal included Classic features plus:

- Eight cinematic Royal templates.
- Video-based opening experiences.
- 3D door and curtain reveals.
- Cinematic hero backgrounds and motion storytelling.
- A Save the Date calendar button.

Checkout stated that the total included taxes. Payment used Razorpay, with an agreement checkbox for the Terms & Conditions and acknowledgement of the Refund Policy before the payment button became available.

The user purchased access personally. The Razorpay transaction steps and payment-method behavior were not inspected.

After purchase, the creation page showed **Used: 0 / 1 · Remaining: 1**. Publishing the test invitation changed this to **Used: 1 / 1 · Remaining: 0**. The dashboard’s subsequent **Create New** action pointed to `/buy-invitations`.

## 5. Invitation creation

**Page:** `/dashboard/create`.

The editor is a long form containing event details, styling controls, music, and expandable optional sections. Its final action is **Generate Invitation Link**. No personalized live preview was visible beside the form; template previews opened sample demos.

### 5.1 Type and design

The host chooses:

1. Invitation type.
2. Invitation collection.
3. Template.

The template selector includes eye-icon preview buttons for sample designs.

### 5.2 Couple and event details

For a wedding, the form exposes:

- Groom’s name and bride’s name.
- Optional details below each name, such as family wording.
- Wedding date and time.
- Venue name and address.
- Optional Google Maps link, with instructions for obtaining it.
- Custom invitation message.

Names, event date/time, venue name, and venue address were marked required in the inspected inputs. A missing date/time caused browser validation to block submission before creation.

If a Maps link is omitted, the editor says it generates the map from the venue name or address.

### 5.3 Styling and effects

Expandable styling groups include:

- Couple Names Styling.
- Sub Text Styling.
- Custom Message Styling.

The inspected name-styling group offers a font selector, pixel-size slider, color picker, and color text field, with template defaults available.

Other controls include:

- Custom countdown title.
- Custom scratch-card reveal text.
- Scratch effect on/off; turning it off reveals the date directly.
- Save the Date button, marked Royal-only.
- Background music on/off and a track selector.
- Custom MP3 upload, with a stated maximum of 4 MB.

### 5.4 Optional content sections

Sections have an enable/disable switch and an expandable configuration area:

- Welcome Message.
- Photo Slideshow.
- Program Timeline.
- Dress Code.
- Pre-Wedding Events / Pre-Engagement Events.
- Transportation.
- Accommodation.
- Gift Message.
- Closing Message.
- Sub-Closing msg.
- RSVP.
- Multi-Language Translation.

The inspected defaults enabled Welcome Message, Photo Slideshow, Program Timeline, Closing Message, Sub-Closing msg, and RSVP. Other sections were initially disabled.

**Photos:** up to four slideshow images; recommended 3:2 landscape ratio. The form says that leaving the uploads empty uses default slideshow images. Upload behavior was not tested; the fictional test invitation disabled the slideshow.

**Timeline:** each entry has date/time, name, and description, with an Add Another Program action.

**RSVP:** hosts can separately add event names. The helper text says guests must choose the event(s) they will attend when this list is configured. These names are entered separately from the program timeline and pre-event sections.

**Translation:** enabling the section exposes a second-language selector. Options observed included Hindi, Urdu, Arabic, French, Spanish, German, Portuguese, Italian, Bengali, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati, Punjabi, Chinese, Japanese, Korean, Turkish, Russian, Thai, Indonesian, and Malay. Translation generation, accuracy, and guest switching were not tested.

### 5.5 Engagement-specific behavior

Switching the type to Engagement Invitation changed:

- Groom/bride labels to fiancé/fiancée.
- Wedding Date/Time to Engagement Date/Time.
- Pre-Wedding Events to Pre-Engagement Events.

The overall form structure remained the same. The warning still referred to a wedding date, and the timeline name placeholder displayed **Reception Ceremony**. These are observed copy/default inconsistencies, not proof of a failure to save engagement invitations.

An engagement invitation was not published during this review.

## 6. Publishing

The tested publishing sequence was:

1. Populate required fields and desired optional sections.
2. Click **Generate Invitation Link**.
3. Review a **Confirm wedding date & time** dialog.
4. Click **Confirm & Create**.
5. Wait for creation to complete.
6. Return automatically to the dashboard with the new invitation card.

The confirmation displayed the chosen date/time and stated that date/time changes require an admin request. Creation showed a success notification and consumed one invitation credit.

There was no separate save-as-draft step in this observed sequence.

### Published test record

- **Couple:** Aarav (Demo) and Mira (Demo).
- **Type:** Wedding Invitation.
- **Template:** Royal Imperial.
- **Date/time:** 14 February 2027, 18:00 as entered; the form did not expose a timezone selector.
- **Venue:** a clearly fictional demo venue in Bengaluru.
- **Content:** prominent notices explaining that the names and event are fictional.
- **Public link:** [Open test invitation](https://zareqia.com/invite/oxx34st6u4b1).

The user explicitly authorized using the credit and publishing this fictional invitation.

## 7. Guest-facing invitation

The public link uses a generated identifier:

`/invite/oxx34st6u4b1`

Once the saved content loaded, the page’s accessible content included:

- The demo notice and couple names.
- Welcome message.
- Event date and time.
- Save the Date control.
- Countdown.
- Program timeline.
- Venue and Google Maps link.
- RSVP form.
- Closing message and Zareqia attribution.

The RSVP form exposed name, email, attendance selection, message, and **Send Message**. A guest submission was not performed. The configured RSVP event choice was not confirmed in the loaded form, so the helper text’s promised event-selection behavior remains unverified.

The page initially exposed generic sample content before loading the saved invitation data. The Royal visual experience remained on a preparing screen during checks, and a subsequent refresh showed a blank dark viewport. Browser connection problems also occurred during this portion of the review. Consequently, publication and saved content were verified, but successful cinematic playback and full visual usability were not established. This is not a measured performance result or a claim that the problem occurs in every browser.

## 8. Dashboard after publication

Each observed invitation card showed:

- Couple names.
- Event date/time and creation date.
- Public link path.
- Editing availability notice.
- **Copy Link**.
- **Share**.
- **View**.
- **Edit**.
- **Analytics**.
- **Make Private**.

The View action pointed to `/dashboard/invitation/<invitation-id>`. The Edit action opened `/dashboard/edit/<invitation-id>`.

Analytics expanded to show **Total Views**, **Unique Visitors**, and **Messages**. All were zero at the inspected moment. Tracking accuracy, update delay, and whether owner visits are excluded were not tested.

Copy/share actions were visible, but delivery through WhatsApp, email, or other recipients was not tested.

## 9. Editing after publication

The edit page largely repeats the creation form, with **Save Changes** replacing the creation action.

Observed behavior:

- Existing values are populated from the saved invitation.
- Wedding date is disabled.
- Wedding time remains editable.
- **Request Date Change** is available.
- Helper text explicitly says that the date is locked and time can be edited.
- Editing is advertised as available until the wedding date.

**Important inconsistency:** creation warned that both date and time were locked, but the actual edit page allows time changes. Only the date was visibly locked. No date-change request was submitted, and an actual time change was not saved.

**Verified edit test:** the Scratch Effect was turned off, Save Changes was submitted, and the edit page was reopened. The switch remained off, confirming persistence. The change did not consume another credit.

## 10. Inbox and attendance management

The dashboard links to `/dashboard/inbox`.

Before publication, the inbox showed **No invitations yet**. The editor describes RSVP responses as messages that appear in this inbox. Post-publication analytics also includes a message count.

The following remain unverified because no guest response was submitted:

- Populated inbox layout and response details.
- Per-event attendance totals and guest-count handling.
- Response editing or cancellation.
- Notifications and exports.
- Duplicate-response behavior.

## 11. Privacy and invitation lifetime

The dashboard notice states:

- Invitations are publicly accessible through their links.
- Invitations automatically become private 30 days after the event.
- Once private, a link is permanently deactivated and cannot be reopened.
- The invitation remains in the dashboard for records.
- Creating a new invitation requires another credit.

On the published future-dated test invitation, **Make Private was disabled**. Its help text said it becomes available only after the event date/time has passed.

The automatic transition and permanent deactivation were not tested. The test invitation was left published.

## 12. Verification boundaries

### Directly tested

- Public homepage, wedding catalog, engagement catalog, and sample demos.
- Signup entry point and signed-in empty dashboard.
- Checkout plans and required agreement controls.
- Paid wedding creation form and engagement form adaptation.
- Styling, photo, timeline, RSVP, and language configuration surfaces.
- Creation confirmation and publication using one credit.
- Saved public invitation content.
- Post-publication editor, date/time controls, and a persisted scratch-effect edit.
- Dashboard analytics surface and privacy-button availability.

### Not tested end to end

- Account verification and Razorpay payment flow, which the user handled.
- Publishing an engagement invitation.
- Successful Royal cinematic playback across devices/browsers.
- Photo/music uploads and translation output.
- Calendar export and Maps navigation.
- Guest RSVP submission and populated inbox management.
- Actual time update, admin date-change request, and support turnaround.
- Sharing to external recipients.
- Automatic privacy transition or reopening behavior.
- Additional-credit purchases, upgrades, and refund handling.

## 13. Reference pages

- [Homepage](https://zareqia.com/)
- [Wedding templates](https://zareqia.com/templates?type=wedding)
- [Engagement templates](https://zareqia.com/templates?type=engagement)
- [Dashboard](https://zareqia.com/dashboard)
- [Checkout](https://zareqia.com/checkout)
- [Create invitation](https://zareqia.com/dashboard/create)
- [Inbox](https://zareqia.com/dashboard/inbox)
- [Published fictional test invitation](https://zareqia.com/invite/oxx34st6u4b1)

Account pages require sign-in and may behave differently depending on credits and existing invitations. Findings above come from direct browser observations in this review, not an inspection of Zareqia’s source code or backend.
