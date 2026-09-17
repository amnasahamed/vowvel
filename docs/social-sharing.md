# Automatic invitation sharing previews

The editor’s “Your link’s first impression” panel generates the title, description and a downloadable 1200 × 630 PNG from the current names, occasion, first ceremony date/venue and selected theme. No extra form fields are needed. Names remain rendered text over the original invitation artwork. Previewing and downloading do not publish a draft.

`src/sharing.ts` is the shared metadata and image composition generator. It escapes text for HTML/SVG, rejects hash-based canonical URLs, uses IST-independent calendar date formatting and handles undecided dates. The image text truncates unusually long venue names; full details remain in the metadata. `src/SharingPreview.tsx` exports the current personalized image locally.

`npm run build` generates a brand image plus five sample images in `dist/og/`, and crawler-readable HTML at `/invitation/conservatory/`, `/invitation/gulmohar/`, `/invitation/afterhours/`, `/invitation/sunday/`, `/invitation/azure/`. These are sample invitations, not published customer drafts. Each HTML response contains title, description, canonical URL, Open Graph type/site/title/description/URL/image/dimensions/alt and Twitter large-image card tags before React runs. Demo invitation pages use noindex/nofollow. This controls search indexing, not access or confidentiality.

Set SITE_URL to the actual public HTTPS origin when building for deployment. With no value, builds intentionally use localhost for local testing; the npm deploy command refuses to proceed without a public HTTPS origin. No domain has been assumed or configured. Vite development serves its source HTML; inspect `dist` or a production preview server to validate initial HTML metadata.

## Production publishing integration still required

On an owner-authorized, paid publication: read the validated published revision, run sharingDetails and sharingSvg using that revision, rasterize the SVG to PNG in the publishing media pipeline, store a revisioned PNG object in R2, and render sharingTags into the initial HTML for that invitation’s actual path or subdomain. Only published fields may be passed into public metadata. Reuse the same revision for the guest page and preview to prevent mismatches. Don’t use a draft’s local storage or hash fragment as a crawler data source. Keep per-invitation canonical and image URLs absolute. Regenerate the image when names, occasion, date, venue or theme change. Version image URLs because external platforms cache link previews. Pause/expiry handling must remove public metadata along with the invitation. Guest RSVP details never belong in metadata.

Real customer publishing and automatic R2 storage are not connected yet. The current local preview does not establish a live WhatsApp/Facebook preview. Validate externally after deployment using the real public link.

## Validation

Production build and nine tests pass, including escaped hostile names, invalid dates, engagement metadata, forbidden URL schemes/hash URLs, initial HTML tags and actual PNG dimensions for all five designs. Browser inspection confirmed the current editor draft produced its own engagement title/date/venue and matching artwork.

Cloudflare static folder index routing: https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
