# CLAUDE.md: AJ GROUPS websites (handoff and working notes)

Read this first. It records where the project stands, how it is built, the decisions already made, and what is still open, so a new Claude Code session (or a new account) can carry on without the old conversation.

Last updated: 22 Nov 2026.

## What this is
The websites for **AJ GROUPS**, founded and led by **Allwyn**. A group of small businesses, each with its own site, all in one repo.

- Static HTML, CSS and vanilla JavaScript. **No build step.**
- **Official site:** `https://ajgroups.co/` (domain bought at Cloudflare; DNS records set to DNS-only, four GitHub A records plus a www CNAME; fallback address `https://ajgroups2026.github.io/AJ-groups/`) (GitHub Pages, branch `main`, repo root), repo `https://github.com/AjGroups2026/AJ-groups`. Git remote name: `official`.
- **Testing copy:** `https://roosewelt-nacth.github.io/AJ-groups/`, repo `https://github.com/Roosewelt-nacth/AJ-groups` (remote `origin`). Try changes here first, then push the same `main` to `official`. Sign-in is through `gh auth login` for each account; never share or store passwords here.
- Both repos are public. Anything committed is public, so **never commit secrets, access codes, personal phone numbers or customer data.** (The one business WhatsApp number above is public by the owner's choice.)
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
- **Social and contact:** Instagram `https://www.instagram.com/aj_dynamics_software_sol/?hl=en`, Facebook `https://www.facebook.com/share/1C9cMXEbwd/`, and WhatsApp (+91 88078 93624, owner-approved for public use; the contact form has a "Chat on WhatsApp" button that pre-fills the message). These are in the group page footer, contact form, structured data and the legal pages, and deliberately not in the shortened phone menu.
- **Speed:** venture photos are WebP (about 190 KB in total), Inter and Instrument Serif are self-hosted on the group page, three.js loads the minified build with a preload.
- **Size check:** open `/?audit=1`; the page title then reports overlaps for that screen size (checked 320 to 1920 wide plus landscape phones).
- **Still to do:** founder photo (the slide has a monogram placeholder, put `<img>` inside `.fphoto`), names to confirm (Bun Bun Cafe on the group page against Bun Bun Bakes on the Bun Bun site), lawyer review of the legal pages.

## Rebrand, 20 Nov 2026 (AJ GROUPS identity)
- **Logo kit** (from Allwyn, "AJ Dynamics rebranding.zip"): a calligraphic A and J monogram with a looping tail, a serif wordmark "AJ GROUPS" and the tagline **"INFINITE POSSIBILITIES"**. Two colourways: **beige** (a cream-to-gold gradient, for dark backgrounds) and **blue** (flat navy `#2d3041`, for light backgrounds). Lock-ups supplied: horizontal, compact, stacked, wordmark, and the monogram alone ("secondary logo").
- **Web files** are in `assets/brand/` (WebP): `logo-horizontal-gold|navy`, `logo-mark-gold|navy`, `logo-stacked-gold|navy`, plus `app-icon-512.png`. `assets/favicon-32.png`, `favicon.svg` (a PNG embedded in an SVG), `apple-touch-icon.png` and `og-aj-groups.png` (share image) were rebuilt from the monogram and the stacked lock-up. Rebuild script lived outside the repo; originals are in the zip.
- **Header logo** (`index.html`, `.mark`): two stacked images, gold and navy. `main.js` sets `--lw` (1 on dark pages, 0 on light ones) and the CSS crossfades them, so the logo follows the chapter and the dark/light theme. Size is `1.3em` of `--ms` (40px on the home chapter, 24px elsewhere; 20px in the phone bar). Privacy and terms pages use the gold logo on their navy field.
- **Tagline:** the home card and the share text now say "Infinite possibilities" (it was "Limitless possibilities") to match the logo. Revert if Allwyn prefers the old line.
- **Do not use** the "Compact lock-up (blue)": it reads "Software Solutions" and belongs to AJ Software Solutions, not the group.
- Sub-brand sites (Bun Bun, Alven, Fovo, Atelier) keep their own looks; they only pick up the new favicon through the shared files.
- **The orb is now the logo (3D).** Shape id `9` in the `shape()` function of the shader is the AJ monogram as a rounded 3D slab. `assets/brand/logo-silhouette.png` (white logo on black, 1024px) is turned into a signed-distance texture once on load (`main.js`, block just above `const frag`; about 50 to 250 ms), and the shader extrudes it (depth `h`, edge rounding `r`, stroke weight offset `.032`). Until the texture is ready the shape is the plain orb. It is used on the Home, Our story and Vision chapters (the `s: 9` entries in `CH`). **Ventures keeps the plain orb** (`s: 0`) because the cards and headline sit on top of it. Glass absorption is multiplied for this shape (3.3, or eased to 1.4 in dark theme on chapters that have a dark-theme glass setting) because the slab is thinner than the sphere and needed more to stay gold rather than copper. Gold glass on dark pages, navy glass on light ones follows the existing tint settings.
- `main.js` was at `?v=85` after the rebrand; it is now `?v=88`. Bump it whenever `main.js` changes.

## Speed work, 23 Nov 2026
- **Measured on the live site** (fast desktop connection): first byte 0.14 s, page loaded 0.7 s, about 520 KB in 21 requests, so the network is not the bottleneck. The delay people feel is start-up work on the phone or laptop itself.
- **The two 3D logo shapes** (`buildLogoSDF` in `main.js`) are now built in a Web Worker (`assets/sdf-worker.js`) instead of on the main thread (about 225 ms on a fast desktop, over a second on a phone). The old main-thread builder stays as `buildLogoSDFMain`, the automatic fallback. `assets/brand/logo-silhouette-512.png` is the 512 px mask. The Bun Bun mark is built 4 s after load, not at start.
- **The shader compiles in the background** (`renderer.compileAsync`); drawing starts when it finishes, or after 3 s at most. The opening waits for the logo texture (1.5 s at most) so the orb never pops from sphere to logo.
- **Venture photos** use `data-src`; `loadVenturePhotos()` fills them in 1.8 s after the opening starts, or at the first touch, key or scroll. Header logos were reduced from 900 px to 560 px wide.
- The opening is about 25 % quicker (`app` speed 0.5, card at 0.7 s, buttons at 1.35 s).
- `performance.mark('aj-logo')` and `('aj-ready')` exist; read them with `performance.getEntriesByType('mark')`.
- **Not done (needs Allwyn's Cloudflare login):** GitHub Pages sends every file with `Cache-Control: max-age=600` and gzip only. Turning the DNS records orange (proxied) with SSL mode "Full" would add Brotli, HTTP/3 and a long browser cache for `/assets/*` through a Cache Rule. Keep HTML on a short cache so updates still appear within minutes.

## Bun Bun Cafe rebrand and more speed work, 23 Nov 2026
- **Brand kit** (from Allwyn, "BUN BUN rebranding.zip"): palette **green `#4a442c`** and **cream `#f8f2e4`**; a rounded "BunBun" wordmark (primary logo) and the "U n" mark (secondary logo), each in cream and green. The venture is now called **Bun Bun Cafe** everywhere on its own page (it used to say Bun Bun Bakes).
- **`bunbun/index.html`:** two looks only, **Cream** (`data-theme="a"`: cream page, green text) and **Green** (`data-theme="b"`: green page, cream text). The old Periwinkle, Midnight and Buttercream looks are gone, and a saved old theme falls back to Cream. The December themes (Plum and Gold, Holly and Berry, Snow and Rum) are **unchanged**; they switch on automatically from 1 Dec. All other blue and navy colours in the page, the packaging boxes and the Christmas card were mapped to green and cream.
- **Logos** are used as CSS masks, so one file takes any colour: `assets/bunbun/logo-word.png` (primary, 800 px) and `logo-mark.png` (secondary, 480 px). `assets/bunbun/logo-silhouette.png` (the 3D shape on the home page) was rebuilt from the new mark, same footprint as before. Bun Bun has its own `bunbun/favicon-32.png` and `bunbun/apple-touch-icon.png` (cream mark on green).
- **Still closed:** the Bun Bun page keeps its `noindex` and redirects visitors to the home page until launch. **To review it, open `/bunbun/?preview`** (the redirect is skipped when the address contains `preview`).
- `bunbun/main.js` is at `?v=54`, `menu.js` `?v=16`, `extras.js` `?v=3`; `assets/vt.js` is at `?v=11`.
- **Resolution governor fixed** (`main.js`): it used to ignore every frame slower than 20 fps, so the slowest phones were never given lower quality. It now reads the real frame time, starts after 1.2 s, and drops resolution faster on very slow devices.
- **`/?perf=1`** shows a small box with live frames per second, the render resolution and the time to ready. Ask for a photo of it when a phone feels slow.
- The small glass chips on the venture cards no longer use `backdrop-filter` (16 fewer blur layers on that slide).

## Bun Bun Cafe: short menu and a quiet page, 23 Nov 2026 (testing repo first)
- **Menu cut to five dishes** in `bunbun/menu.js`: Classic New York and Biscoff cheesecake, Classic Fudge and Salted Caramel brownie, Caramel Pudding. The full list is kept as `MENU_FULL`; `ON_MENU` (a set of ids) chooses what shows. Add an id to bring a dish back.
- **Cake studio is birthday only**, with Tiers, Finish, Sponge, Buttercream, Message, Quantity and Delivery. Occasion, Drip, Decoration and the Decorate/Clear/Surprise buttons are hidden (`hidden` attribute, code untouched). The cake starts plain (no strawberries or berries).
- **Hidden sections** (markup kept, `hidden` attribute): Occasions, Plan it early (save a date) and The bakers (it was only placeholder text). Shown: hero, Cake studio, Menu, Packaging, How it works, Order. Remove the `hidden` attributes to bring any back.
- **No automatic December look** any more; the Christmas pages still open with `?xmas=1`.
- **Packaging mockups** (`assets/bunbun/pack-*.jpg`) were recoloured from periwinkle and navy to cream with green marks (blue pixels mapped through a green-to-cream gradient). The unrecoloured originals are in git history.
- Hero: "Design a birthday cake" and "See the menu". `bunbun/index.html` loads `main.js?v=55`, and `main.js` loads `menu.js?v=17`.

## 3D look and speed, 24 Nov 2026 (testing repo first)
- **Logo glass:** the landing logo used fully clear glass (`fe.z = 1`), which looks silver on a thin slab; it is now part-solid (`fe.z = .55`) so it reads as champagne gold. The dark-theme glass on the light chapters (`absD`) was shifted from copper to gold, and the Bun Bun mark is cream glass to match its rebrand.
- **Drawing less:** with reduced motion the 3D view is only redrawn when something changes; on a device that is still under 30 fps at the lowest resolution the view is drawn every other frame (`half`, test with `?half=1`). `?perf=1` shows the live numbers.
- **Service worker** (`sw.js`, registered on the home page over HTTPS only; test locally with `?sw=1`): pages come from the network first, so updates show at once; files with a `?v=` number, fonts and three.js are reused from the device; other files are shown from the device and refreshed in the background. A second visit downloads almost nothing. **Always bump `?v=` when a script or stylesheet changes.** The baker dashboard keeps its own worker. To switch caching off for everyone, publish a `sw.js` that unregisters itself. The privacy policy mentions the on-device copy.

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

## Bun Bun Cafe rebuilt as an eight-page site, 24 Nov 2026 (testing repo first)
- Built from Allwyn's brief: Home, About Us, Our Menu, Custom Cakes, Seasonal Specials, Our Brand, How to Order, Contact Us (`bunbun/`, `bunbun/about/`, `menu/`, `custom-cakes/`, `seasonal/`, `brand/`, `how-to-order/`, `contact/`). Shared look in `bunbun/site.css`, shared header, footer, product cards and ordering in `bunbun/site.js`.
- **Edit business details at the top of `bunbun/site.js` (`BUNBUN`)**: WhatsApp number (AJ GROUPS number for now, by request), Instagram link (null until shared), FSSAI number (null), menu items, prices, sizes, photos, featured items, seasonal cakes. Anything null shows as "to be confirmed".
- **Ordering is WhatsApp only** (plus an Instagram link): every Order Now opens a short form (product, quantity, preferred date, requirements) and then WhatsApp with the message filled in. Custom cakes enforce 2 days' notice. No cart, payment, tracking, pincode check or cake studio, as the brief asks.
- Founder is **Monisha Janet** (Founder and Certified Baker); the Bun Bun name is credited to Allwyn Jerold; family support is mentioned. Do not present Allwyn as founder.
- Footer says "by AJ GROUPS" (not "part of AJ GROUPS") and uses the page colour.
- The old one-page site (cake studio, order tracker, pay step) is in git history before this change; its JS files (`main.js`, `menu.js`, `desserts.js`, `extras.js`, `tracker.js`, `pay.js`, `store.js`) are no longer loaded. `bunbun/baker/` is untouched.
- Every page keeps `noindex` and the redirect unless the address has `?preview`; `site.js` carries `?preview` on internal links.
- Waiting on: menu, seasonal menu, cake menu (from Allwyn), FSSAI number, Instagram link, Bun Bun's own WhatsApp number, product and founder photos.

## Bun Bun home: standard entry and Christmas entry, 24 Nov 2026
- **Standard entry (all year, the "official" look):** the Bun Bun logo centred (mark and wordmark), one line, Explore Our Menu and Order Now (`section.lg.only-std` in `bunbun/index.html`).
- **Christmas entry (until the end of 1 Jan 2027):** the editorial plum cake hero, the scrolling plum cake story and the home Christmas section (`.only-season`). A small script in `<head>` adds `html.season` while the date is before 2 Jan 2027, so the site switches back to the logo entry by itself. Review either with `?season=1` or `?season=0`.
- Next season: change the date in that script and the seasonal content; the Seasonal Specials page stays all year.

## Bun Bun as one scrolling page, 24 Nov 2026
- Bun Bun is now **one page** (`bunbun/index.html`) in five chapters: `#home` (logo entry, brief hero text, highlights, Christmas block in season, featured; the scrolling plum cake story was removed on request), `#menu` (with `#seasonal` plum cakes in season), `#cakes`, `#about` (story, founder, philosophy, FSSAI, brand identity and packaging), `#order` (how to order, WhatsApp/Instagram/location, closing call to action).
- The old addresses (`about/`, `menu/`, `custom-cakes/`, `seasonal/`, `brand/`, `how-to-order/`, `contact/`) are small redirect files to their chapter.
- Header links scroll to chapters and highlight the one you are reading; laptops also show a slim chapter index with a progress line on the left. Each chapter shows its number faintly at the top right.
- The blade wipe between pages and the next/previous links were removed (not needed on one page). Cream/Green switch, WhatsApp order sheet, and the season switch (`?season=1/0`) are unchanged.
