# Webgency reference study

Read-only study of public pages. Saved HTML is reference material, not application code. No competitor media was copied into Vowvel assets. Findings below come from page content and HTML/CSS/JavaScript inspection; full rendered viewport/playback inspection was not performed by this agent.

## Sources and saved pages

- [Public website](https://webgencyinvitations.com/) — `home.html`
- [The Sacred Garden](https://webgencyinvitations.com/thesacredgarden) — `sacred-garden.html`
- [Blossom & Oud](https://webgencyinvitations.com/blossomoud) — read through public page extraction
- [Dolce Vita](https://webgencyinvitations.com/dolcevita) — `dolce-vita.html`
- [Royal Gold](https://template2.tilda.ws/) — catalog resolves to this public demo; read through page extraction

## Structural findings

### The Sacred Garden

The entry is an image overlay that hands off to a separate full-screen video layer. Clicking fades the image over 1.4 seconds and plays a muted inline video while starting independent music. Video fades 0.8 seconds before its end, then a floating audio toggle appears. An additional looping swan video supplies continuing motion inside the invitation. This is a staged cinematic reveal rather than just a rotating CSS triangle.

The content sequence is names/date → ceremonial welcome → countdown → five-event schedule → location/map → gift and dress information → attendance → closing. Numerous separate illustration images recur between information groups. CSS repeatedly uses parchment `#f9f0e0`, bronze `#a67d2b`, and brown `#6c513f`; serif declarations include Ovo and Cinzel alongside custom fonts. The cinematic wrapper and illustrated details create a consistent ceremonial world.

### Dolce Vita

The opening uses multiple polygon image components, an explicit opening control, independent audio, and a looping Italian villa terrace video. Main sections move from names into a three-part day/month/year scratch reveal, personal welcome, six-event timeline, venue, visual dress guidance, and RSVP. Near-white `#fffdfb`, dark gray, and muted blue `#64a0bd` provide a coastal stationery palette; Rufina and Imperial Script appear in the styles.

The scratch interaction has three separate canvas tiles, textured coats painted with diagonal stripes and glints, a 40% erased-area completion threshold, and a final confetti flourish once all three tiles are complete. That makes scratching a composed multi-step moment. Vowvel can adapt the principle to a nonessential personal surprise, with an accessible reveal action and date visible elsewhere.

The opening's actual Tilda keyframe data moves left/right image panels roughly 560px outward, lowers another panel 596px, and lifts a top panel 430px. Motions take 1.5–2 seconds after a 2.5-second delay; a central element expands to 1.22× while fading. This confirms layered envelope disassembly, not merely a video poster. Ambient image loops also translate illustrations vertically. Sacred Garden uses subtle illustration breathing loops (1.04–1.06× scale and ±2° rotation over two seconds).

### Blossom & Oud

The page pairs French and Arabic invitation text, then countdown, a four-part reception/Nikah/dinner/party schedule, venue, dress palette and attire guidance, an RSVP form, map, and closing. Repeated illustration assets bind the sections together. Audio and video elements are both present. The RSVP schema includes name, party size, and attendance. Actual opening choreography was not verified from playback.

### Royal Gold

The linked demo begins with video, names/date, then welcome and countdown. This confirms a different video-first entry structure; precise artwork and motion details need rendered inspection before claiming more.

## Transferable direction for Vowvel

1. Design the opening as a material transformation: closed object → unfolding world → invitation composition. A seal tap alone is insufficient if the same generic layout follows.
2. Give each design its own illustration vocabulary across sections, not one hero artwork repeatedly cropped. Useful independent assets include opening object, hero scene, divider motifs, venue vignette, and reply-card detail.
3. Compose interaction beats around content: introductory reveal, tactile surprise, articulated schedule, illustrated practical information, then a reply card. Keep date, directions, and replies immediately reachable.
4. Use video only where movement adds meaning. Preserve a matching static first/last frame and a skip/reduced-motion route. Keep text as actual HTML over or beside art.
5. Treat the reference as visual direction, not code to reproduce: the saved implementation has media waits, audio coupled to opening, and no obvious reduced-motion handling in the inspected custom sequences.

## Production boundaries

The original media URLs are recorded inside the saved HTML for traceability. They are not approved Vowvel assets. Generate original artwork/video and do not hotlink these competitor files. The reference site also uses a designer-assisted ordering model; Vowvel's intended preview-before-payment self-service flow should remain intact.
