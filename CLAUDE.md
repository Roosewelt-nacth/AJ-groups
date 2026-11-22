# CLAUDE.md: AJ GROUPS websites (handoff and working notes)

Read this first. It records where the project stands, how it is built, the decisions already made, and what is still open, so a new Claude Code session (or a new account) can carry on without the old conversation.

Last updated: 22 Nov 2026.

## What this is
The websites for **AJ GROUPS**, founded and led by **Allwyn**. A group of small businesses, each with its own site, all in one repo.

- Static HTML, CSS and vanilla JavaScript. **No build step.**
- **Official site:** `https://ajgroups.co/` (domain bought at Cloudflare; DNS records set to DNS-only, four GitHub A records plus a www CNAME; fallback address `https://ajgroups2026.github.io/AJ-groups/`) (GitHub Pages, branch `main`, repo root), repo `https://github.com/AjGroups2026/AJ-groups`. Git remote name: `official`.
- **Testing copy:** `https://roosewelt-nacth.github.io/AJ-groups/`, repo `https://github.com/Roosewelt-nacth/AJ-groups` (remote `origin`). Try changes here first, then push the same `main` to `official`. Sign-in is through `gh auth login` for each account; never share or store passwords here.
- Both repos are public. Anything committed is public, so **never commit secrets, access codes, phone numbers or customer data.**
- Target launch: **22 Nov 2026** (AJ GROUPS, Fovo, Alven first; Bun Bun was moved to "upcoming" on 22 Nov). Do not publish this date on the sites until Allwyn approves it.

## Folder map
| Folder | What it is |
|---|---|
| `/` (`index.html`, `main.js`) | The AJ GROUPS home page, served at the domain root (`https://ajgroups.co/`): a swipe deck of 15 chapters (home, about, founder, founder note, vision, ventures, each of the eight brands, contact) |
| `aj-groups/` | Only a redirect to `/`, kept so old links still work |
| `alven/` | Alven Studio (marketing) |
| `fovo/` | House of Fovo (photography). `draft-mac/` is an unused earlier version |
| `bunbun/` | Bun Bun Bakes (bakery). The most developed site. See below |
| `bunbun/baker/` | Baker dashboard (installable web app, hidden from search) |
| `clothing/` | Atelier. Not linked yet and hidden from search |
| `assets/` | Shared `motion.js`, `vt.js` (?v=10), `vt.css`, `menu.css/js`, `send.js` (form sender), `fonts.css` plus `fonts/` (self-hosted Inter and Instrument Serif), `legal.css`, and images (`ventures/` holds the venture card photos as WebP) |
| `privacy/`, `terms/` | Privacy Policy and Terms and Conditions pages |
| `server/` | `worker.js` (Cloudflare Worker for orders) and `SETUP.md` (plain-language setup) |
| `tools/` | Helper scripts (`prep_photos.py` prepares menu photos) |
| `client/` | Scratch and review files, not part of the public site |
| `reels/` | Testing repo only. Marketing reels (`video/`: laptop, iPad and ventures MP4s with soundtrack, poster PNG) and their sources, soundtrack script and render tools. See `reels/README.md`. Hidden from search |

Older drafts live outside the repo in `AJ-Groups-Drafts` (next to this folder on the original computer). They are not needed to continue.

## Run and check locally
```bash
python -m http.server 5173
```
Open http://localhost:5173. There is no build, lint or test suite. Quick syntax check for a module: `node --input-type=module --check < file.js`.

Phone testing: the preview's "mobile" emulation can crop screenshots and mislead. Use a 375 px wide iframe page and scroll with `scrollTo`, or open the site on a real phone via the computer's Wi-Fi address.

## Deploy
Commit to `main` and push. GitHub Pages updates in about one to two minutes. Git identity on the original machine: user `Roosewelt-nacth`.

Browsers cache modules by query string. When you change a JS file in `bunbun/`, **bump its `?v=` number** where it is imported (currently `main.js?v=53`, `menu.js?v=15`, `store.js?v=2`, `tracker.js?v=4`, `pay.js?v=1`, `extras.js?v=2`, `desserts.js?v=13`). `assets/vt.js` is at `?v=6`.

## Bun Bun Bakes (bunbun/)
Files: `index.html` (page and CSS), `main.js` (studio, snow, order form), `desserts.js` (procedural 3D desserts, three.js 0.170.0 via importmap), `menu.js` (all editable business data), `extras.js`, `tracker.js`, `pay.js`, `store.js`.

**Edit business data in `menu.js`:** `MENU`, `XMAS` and `XMAS_CAT` (Christmas range, `demo:true`), `DELIVERY` (radius, fees, cutoff, slots), `TRACKER`, `PAYMENT`, `BACKEND`. Prices, batches, dates and alcohol wording are **sample data** until Allwyn confirms them.

**Features built:** 3D cake and dessert studio; December Christmas look (automatic 1 to 26 Dec, force with `?xmas=1`, disable with `?xmas=0`; three themes: Plum and Gold, Holly and Berry, Snow and Rum); layered snow that settles on objects and sheds on scroll (`?snow=0` disables); glass UI over a blurred backdrop; live cake message styles, share link and card, delivery map with ETA, saved dates with countdowns; order form with a delivery slot; seven-stage order tracker; "Pay now" step.

### Order flow: two modes
- **Demo mode** (`BACKEND.url` is empty, the current state): orders are stored in the customer's own browser (`localStorage`). **The bakery receives nothing.** The baker page only shows orders placed on the same device.
- **Remote mode:** set `BACKEND = { url: 'https://<worker-address>' }` in `menu.js`. Orders go to a Cloudflare Worker with KV storage. The baker reads them at `/bunbun/baker/` with a secret access code.

### Payments (free flow, by design)
UPI deep link (`upi://pay?...` with the order number in the note) or a payment link, a customer tap "I've paid", then **the baker confirms** after the money shows in their own UPI or bank app. This is not foolproof and the site cannot know on its own whether money arrived. Fill `PAYMENT` in `menu.js` (`upiId` or `link`, `payeeName`, `depositPercent`). Automatic UPI checking (an Android notification reader) was discussed and deferred.

### Security model (do not weaken)
- Baker list, update and delete need the access code (at least 12 characters); 8 wrong tries lock an address out for 15 minutes.
- Orders only accepted from `ALLOW_ORIGIN` (the website address). Must be set to the real domain when it exists.
- A customer sees their own order status only through a private per-order token kept on their device. Order numbers alone are not enough.
- Customer text is escaped on the baker page; CSV export defuses spreadsheet formulas; orders auto-delete after 180 days; baker can delete any order.
- **Never ask for, receive or store the access code, bank details, UPI credentials, gateway keys or Telegram tokens.** Allwyn enters them himself in the Cloudflare dashboard. The worker address itself is not secret.
- `server/SETUP.md` has the full free setup (Cloudflare KV namespace `bunbun-orders`, binding `ORDERS`, secret `BAKER_CODE`, variable `ALLOW_ORIGIN`, optional Telegram alerts).

## Site-wide behaviour
- Phone bottom nav (`.mo-dock`) and the header hide on scroll down and return on scroll up, on every site (`assets/vt.js`).
- `robots.txt` hides `/bunbun/baker/` and the clothing site from search.
- Forms on the other sites are demos until a form service is connected.

## Decisions already made
- Quiet, premium look. The Bun Bun hero is the **logo** (a decorated hero and a plum-cake hero were both rejected as childish or wrong).
- Free tools only for now (GitHub Pages, Cloudflare free plan, UPI).
- Domain: Allwyn agreed to create a domain. `ajgroups.com`, `ajgroups.in`, `ajgroups.co.in`, `aj-groups.com` and `ajgroup.in` are **already registered by others** (checked 16 Nov 2026). Looked available then (confirm at a registrar): `ajgroupsindia.in`, `ajgroupsindia.com`, `ajcircle.in`, `ajcircle.com`, `aj-groups.in`, `ajgroupsofficial.in`. Preferred: `ajgroupsindia.in`, or a rename such as `ajcircle`.
- Email: start with Zoho Mail free plan (up to 5 mailboxes); Google Workspace Base is the upgrade (about 99 rupees per user per month before GST, per Google's page; other figures were from resellers and unverified).
- Gift hampers for Bun Bun: planned, not built. Three tiers (Petite, Classic with plum cake, Grand), a build-your-own option, a corporate enquiry form, aim for 40 to 50 percent cost, FSSAI and alcohol labelling checked, an alcohol-free option. Waiting on Allwyn's ideas, costs and capacity.
- Mobile "swipe card" redesign for the group page (dark glass card stack with a stats row, tag chip, ✓/✕ actions, floating pill nav) was **prototyped and then reverted by request** to keep the page simple. The prototype is not in the repo. If it is wanted again, rebuild it as a separate mobile-only layout and do not show internal facts such as the launch date or chapter count as "stats".

## Added 19 Nov 2026
- **Group page order:** Home, About, Meet the founder, A note from the founder, Vision, Ventures, then Bun Bun Cafe, Alven Studio, House of Fovo, AJ Little Wonder World, Clothing Brand, AJ Software Solutions, Online Course, Digital Products, Contact. Every venture card jumps to that brand's own slide; no slide links out to a brand site any more (Bun Bun's link was removed on 22 Nov, see below). The others show "Coming soon" until they launch. Slide numbers in `data-go` match the slide order in `index.html`, so renumber them if slides move.
- **Forms** (group contact, Alven brief, Fovo booking) send by e-mail to `ajgroups.official2026@gmail.com` through FormSubmit (`assets/send.js`). The address must confirm the one-time activation e-mail from FormSubmit before messages arrive. Bun Bun orders use their own system (see Order flow).
- **Legal:** `privacy/` and `terms/` pages, a footer on the contact slide and on every brand page, `THIRD-PARTY.md` (licence check), `sitemap.xml`.
- **Social:** Instagram `https://www.instagram.com/aj_dynamics_software_sol/?hl=en` is linked from the page footers (not from the phone menu since 22 Nov). **A Facebook page link has not been given yet.**
- **Speed:** venture photos are WebP (about 190 KB in total), Inter and Instrument Serif are self-hosted on the group page, three.js loads the minified build with a preload.
- **Size check:** open `/?audit=1`; the page title then reports overlaps for that screen size (checked 320 to 1920 wide plus landscape phones).
- **Still to do:** founder photo (the slide has a monogram placeholder, put `<img>` inside `.fphoto`), Facebook link, real contact phone, names to confirm (Bun Bun Cafe on the group page against Bun Bun Bakes on the Bun Bun site), lawyer review of the legal pages.

## Rebrand, 20 Nov 2026 (AJ GROUPS identity)
- **Logo kit** (from Allwyn, "AJ Dynamics rebranding.zip"): a calligraphic A and J monogram with a looping tail, a serif wordmark "AJ GROUPS" and the tagline **"INFINITE POSSIBILITIES"**. Two colourways: **beige** (a cream-to-gold gradient, for dark backgrounds) and **blue** (flat navy `#2d3041`, for light backgrounds). Lock-ups supplied: horizontal, compact, stacked, wordmark, and the monogram alone ("secondary logo").
- **Web files** are in `assets/brand/` (WebP): `logo-horizontal-gold|navy`, `logo-mark-gold|navy`, `logo-stacked-gold|navy`, plus `app-icon-512.png`. `assets/favicon-32.png`, `favicon.svg` (a PNG embedded in an SVG), `apple-touch-icon.png` and `og-aj-groups.png` (share image) were rebuilt from the monogram and the stacked lock-up. Rebuild script lived outside the repo; originals are in the zip.
- **Header logo** (`index.html`, `.mark`): two stacked images, gold and navy. `main.js` sets `--lw` (1 on dark pages, 0 on light ones) and the CSS crossfades them, so the logo follows the chapter and the dark/light theme. Size is `1.3em` of `--ms` (40px on the home chapter, 24px elsewhere; 20px in the phone bar). Privacy and terms pages use the gold logo on their navy field.
- **Tagline:** the home card and the share text now say "Infinite possibilities" (it was "Limitless possibilities") to match the logo. Revert if Allwyn prefers the old line.
- **Do not use** the "Compact lock-up (blue)": it reads "Software Solutions" and belongs to AJ Software Solutions, not the group.
- Sub-brand sites (Bun Bun, Alven, Fovo, Atelier) keep their own looks; they only pick up the new favicon through the shared files.
- **The orb is now the logo (3D).** Shape id `9` in the `shape()` function of the shader is the AJ monogram as a rounded 3D slab. `assets/brand/logo-silhouette.png` (white logo on black, 1024px) is turned into a signed-distance texture once on load (`main.js`, block just above `const frag`; about 50 to 250 ms), and the shader extrudes it (depth `h`, edge rounding `r`, stroke weight offset `.032`). Until the texture is ready the shape is the plain orb. It is used on the Home, Our story and Vision chapters (the `s: 9` entries in `CH`). **Ventures keeps the plain orb** (`s: 0`) because the cards and headline sit on top of it. Glass absorption is multiplied for this shape (3.3, or eased to 1.4 in dark theme on chapters that have a dark-theme glass setting) because the slab is thinner than the sphere and needed more to stay gold rather than copper. Gold glass on dark pages, navy glass on light ones follows the existing tint settings.
- `main.js` was at `?v=85` after the rebrand; it is now `?v=88`. Bump it whenever `main.js` changes.

## Open items (waiting on people, not on code)
1. **Allwyn:** pick and buy the domain in his own registrar account, turn on two-step login, set up email. Then the site needs: a `CNAME` file, the Pages custom domain with HTTPS, canonical links, `sitemap.xml`, and `ALLOW_ORIGIN` set to the new domain.
2. **Allwyn:** deploy the Cloudflare backend per `server/SETUP.md` and send the **worker address** (not the code). Then set `BACKEND.url` in `bunbun/menu.js`, bump `?v=`, push.
3. **Allwyn:** a UPI id or payment link for `PAYMENT`.
4. Real content: prices, batches, dates, alcohol wording, photos, hot-drinks menu, founder story and portrait, real contact form backend.
5. Later: AJ Softwares and AJ Little World pages, privacy and terms pages, favicon and share image, the possible "bakery ordering kit" product with Bun Bun as the pilot.
6. **Not yet verified:** a run on a real iPhone and Android, and the Clothing page's phone dock.

## How to continue from a new account
1. Install Git, Python 3 and Claude Code. Sign in to the new account.
2. Sign in to GitHub as a user with **write access** to `Roosewelt-nacth/AJ-groups` (ask the owner to add the new account as a collaborator, or fork it), then:
   ```bash
   git clone https://github.com/Roosewelt-nacth/AJ-groups.git
   cd AJ-groups
   python -m http.server 5173
   ```
3. Open the folder in Claude Code. It reads this file automatically. A good first message: "Read CLAUDE.md and tell me where we are and what is waiting on Allwyn."
4. Claude's saved memory does **not** move between accounts, so this file is the memory. Keep it updated when decisions change.
5. Set the git identity on the new machine (`git config user.name` and `user.email`) and check pushes work before relying on them.

## Working preferences (from the owner)
- Show a local preview before anything is pushed. Push only when asked.
- Keep it simple and premium. Avoid childish or cluttered decoration.
- Check every page and every screen size (phone included) before calling work done.
- Say plainly what was not verified. Prefer free options and explain costs in plain words.

## Changes, 21 to 22 Nov 2026
**Home page (`index.html`, `main.js`, now `main.js?v=88`)**
- **Hero headline** and page/share title: "Diverse ventures, one vision" (was "One-stop solution"). The JSON-LD slogan matches.
- **Landing intro:** an inline script in `<head>` sets `--bg0` from the saved or system theme so the first frame does not flash; the hero stop never gets the frosted `.peek` blur (it used to blur the 3D logo for the first two seconds); the "01 / 15" counter and "Swipe to explore" fade in last (`html.ready:not(.settled)`, `settled` is added 4.5 s after `ready`). On phones the logo sits in `LY.zone0`, the space between the page counter and the hero card (falls back to the normal zone if there is less than about 80 px).
- **Phone menu:** only About us, The founder, Vision and mission, Our ventures, Contact, then "© 2026 AJ GROUPS · Terms". Bun Bun, Instagram and Privacy were removed from the menu on request; the page footers still link Privacy, Terms and Instagram.
- **Founder card** is in Allwyn's first person (three short paragraphs starting "My journey began in 2022 with AJ Dynamics"). The button still says "A note from him" and the note slide is titled "In his words"; change them if Allwyn wants first person there too.
- **Ventures chapter:** smaller headline on phones (about 26 px at 390 wide) and laptops (about 58 px at 1440×900); phone cards are equal (photo on top, name in a bar below, category hidden); laptop cards start every glass panel at the same line and show number, name and category only. Heading text-shadows were removed everywhere (they drew dark boxes behind the word masks); laptops use a soft `drop-shadow` on headings instead. "distinct identities" uses a brighter gold (`#e3c48f`).
- **Small screens:** the founder's note quote shrinks on phones shorter than 700 px so its button stays inside the card; the founder chapter text is smaller on laptops shorter than 800 px.

**Bun Bun (closed as upcoming)**
- Venture card and chapter say "Coming soon" (card class `vc soon`, chapter button is a disabled `span.enter`). No link to `/bunbun/` remains on the home page, in the 404 page or in `sitemap.xml`.
- `bunbun/index.html` has `noindex` and redirects to the home page. Delete those two lines at the top of the file (and restore the links) to reopen it. The Bun Bun code is untouched otherwise.
- Card photo `assets/ventures/bun.webp` is cookie dough in an oven, supplied by the client (credit line updated).
- The chapter's 3D object is **shape 10**: the Bun Bun mark (`assets/bunbun/logo-silhouette.png`, made from `assets/bunbun/logo-mark.png`) turned into a second SDF texture (`uLogo2`) by `buildLogoSDF()`, same slab treatment as the AJ logo (shape 9). `kLogo` absorption applies to both.

**Checking tools**
- `?audit` puts a layout report in the tab title for the current screen size. Known, accepted results: on laptops "5: text over orb" (the ventures grid sits over the centred orb by design); on phones "1: headline off sides; panel off/under dots" (measured mid-transition, the About chapter is fine once settled).
- `?s=<chapter>&t=3` pins a chapter (0 to 14) with a fixed time, for screenshots.
- Checked on 22 Nov in headless Chrome at 360×640, 375×667, 390×844, 414×896, 768×1024, 844×390, 1024×768, 1280×720, 1440×900 and 1920×1080, light and dark; every page loads without script errors, broken images or dead links. **Not yet checked on a real phone.**

**Reels (testing repo only, `reels/`)**
- `reels/video/`: `AJ-Groups-Reel-Laptop.mp4` and `AJ-Groups-Reel-iPad.mp4` (20 s), `AJ-Groups-Reel-Ventures.mp4` (25 s), all 1080×1920 with original synthesised soundtracks, and `AJ-Groups-Signal-Poster.png`. Made for Allwyn to review and share.
- Sources, frozen site copies, the soundtrack script (`reels/audio/score.py`) and the stepped-clock recorder (`reels/rec/rec.cjs`) are alongside; `reels/README.md` explains preview, re-render and adding the sound. `/reels/` is disallowed in `robots.txt`. The official repo does not carry the reels.
- The videos were rendered on 20 to 21 Nov, so they still show "One-stop solution" and Bun Bun as open. Re-render if they must match the current site.
