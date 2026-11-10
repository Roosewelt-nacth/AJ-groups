# AJ GROUPS website

Corporate website for **AJ GROUPS** and its five businesses: Alven Studio, House of Fovo, AJ Software Solutions, Bun Bun Bakes and AJ Little Wonder World.

It's a static site (plain HTML, CSS and JavaScript). There's no build step and nothing to install.

## Run it locally

Open `index.html` in a browser, or serve the folder (recommended, so fonts and transitions behave like the live site):

```bash
python -m http.server 5173
```

Then visit http://localhost:5173.

## Project structure

```
index.html              page shell: navigation dock, footer, script/style includes
assets/
  css/
    styles.css          base design system: heritage colours, type, buttons, nav, footer, forms, overlays
    sections.css        page sections: hero, ribbons, house folios, family diagram, directory, business pages
    theme-gallery.css   the Gallery theme (overrides the two files above when it is active)
    motion.css          shared photo transitions, gallery viewer, carousel, blur-up photos
  img/
    crest.svg           browser-tab icon (the AJ crest)
  js/
    content.js          ALL editable text, contact details, businesses, ventures, colours
    pages.js            page templates built from content.js
    app.js              behaviour: routing, animations, scroll effects, forms
    motion.js           motion layer on top of app.js (GSAP, PhotoSwipe, Embla, shared transitions)
```

## Updating details (you only need `assets/js/content.js`)

| What you want to change | Where in `content.js` |
|---|---|
| Email, phone, location, social links, footer note, founding year ("Est.") | `SITE` |
| Hero intro text, tags, rotating words, big statement | `HERO` |
| Notes in the hero "Correspondence" card | `HERO_NOTES` |
| A business's name, description, services, colours | `BUSINESSES` |
| Upcoming ventures | `VENTURES` |
| Story, mission, vision, approach | `ABOUT` |
| Values | `VALUES` |
| "How we conduct business" principles (home page) | `WHY_POINTS` |
| Partnership types (also fills the form dropdown) | `PARTNERSHIP_TYPES` |

Lines marked `// TODO` are placeholders waiting for real details.

**Add a business:** copy one `{ ... }` block in `BUSINESSES`, paste it after the last one, then change the `id` (lowercase, no spaces) and the values. Its card, home-page chapter, orbit node, footer link and its own page are all created automatically.

**Social links:** put the full URL in `url`. While a URL is empty, the link shows as "link to be added".

**Images:** every photo is set in `content.js`: `IMAGES` for the about, partnerships and contact pages, `image` and `gallery` on each business, and `image` on each venture. They're currently free stock photos from Unsplash (free to use under the [Unsplash License](https://unsplash.com/license)). To use your own, drop the files in `assets/img/` and replace the value with a path, for example `image: 'assets/img/bakery-cover.jpg'`.

## Not done yet

- **Forms:** the forms check what's typed, but they aren't connected to a backend, so nothing is sent. Hook them up to a form service (for example Formspree or Netlify Forms) or an email API before launch.
- **Gallery images:** the business-page galleries show sample stock photos, not real work. Replace them before launch.

## Look and feel (two themes)

The site has two themes that share all content and layout:

- **Gallery** (default): clean and photography-first, following `DESIGN.md`-style rules: white, parchment and graphite sections, one blue action colour, pill buttons, tight sans-serif headlines. Styles live in `assets/css/theme-gallery.css`.
- **Heritage**: old-money serif look.

To switch the whole site, change `DEFAULT_THEME` in the small script in `index.html`. To preview the other theme without switching, add `?theme=heritage` or `?theme=gallery` to the address, for example `https://roosewelt-nacth.github.io/AJ-groups/?theme=heritage`.

Heritage style: ivory paper, racing green, oxblood and antique gold, with Cormorant Garamond and EB Garamond type. Each house keeps its own deep colour (set in `colors` in `content.js`), shown on its folio, seal and page. Photos get a light warm tone and a mat frame so stock and real photos sit together.

## Colour strategy

Both themes follow the 60-30-10 rule, and every text colour is checked against WCAG AA
(4.5:1 for normal text, 3:1 for large text) on every surface it appears on.

| Role | Share | Heritage | Gallery |
|---|---|---|---|
| Canvas | 60% | Ivory `#f3ecdd`, parchment `#ebe2cf` | White `#ffffff`, parchment `#f5f5f7` |
| Structure | 30% | Racing green `#1e3a2f` (nav, dark sections, footer) | Graphite `#272729` tiles, brand panels |
| Accent | 10% | Oxblood `#6e1f2a` buttons (complementary to the green) | Action blue `#0066cc` links and buttons |
| Text | | Ink `#1d1b16`, secondary `#5a5246`, gold labels `#7a5a22` (on green: `#c9a96a`) | Ink `#1d1d1f`, muted `#6e6e73` (on graphite: `#a1a1a6`) |
| States | | Success `#2f6b3f`, warning `#8a5a00`, error `#a1262f` | Success `#1e7b34`, warning `#a35200`, error `#d70015` |

Rules that keep text readable:

- Gold has three jobs: a darker text gold for small labels on ivory, a light gold for text on green, and the original antique gold (`--rule`) for lines and ornaments only.
- Brand panels use one hue that only gets darker (no lighter second colour), so the ivory text stays above 4.5:1 across the whole panel. The lightest brand colour (House of Fovo ochre) gives 5.9:1.
- Text on a brand colour always uses that brand's `colors.text`. Links there are ivory and underlined rather than blue.
- When you change a brand's `colors.main` in `content.js`, keep ivory text on it at 4.5:1 or more (check at https://coolors.co/contrast-checker).

## Page transitions

- **Heritage:** a parchment leaf with the crest turns over the page like a ledger page, then turns away.
- **Gallery:** a camera-aperture circle opens from the point you tapped, then closes back into it.

Both are skipped for visitors who turn on "reduce motion".

## Motion and gallery

`assets/js/motion.js` adds, on top of `app.js`:

- **Shared photo transitions:** tapping a brand's photo on the home page or the houses list glides that photo and name into the brand page header (browser View Transitions). Other links use the theme's page turn or aperture.
- **Scroll reveals** (GSAP + ScrollTrigger + SplitText): section headings rise line by line, brand names letter by letter, photos drift gently. Text is only hidden at the moment its reveal starts and is always forced visible shortly after, so a slow phone can never leave text hidden.
- **Gallery** (PhotoSwipe): pinch to zoom, swipe, swipe down to close.
- **Ventures carousel** (Embla): momentum and clean snapping.
- **Blur-up photos:** photos sharpen in from a soft preview.

Libraries load from jsDelivr at fixed versions (GSAP 3.13.0, PhotoSwipe 5.4.4, Embla 8.6.0). If one fails to load, the simpler built-in version in `app.js` is used instead.

## Accessibility and motion

Visitors with "reduce motion" turned on get a calm version: no intro, smooth scrolling, scroll effects or page veil. The photo that follows the pointer on the houses page only turns on for mouse or trackpad users. The gallery viewer works with arrow keys, Escape and swipes.
