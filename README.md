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
  img/
    crest.svg           browser-tab icon (the AJ crest)
  js/
    content.js          ALL editable text, contact details, businesses, ventures, colours
    pages.js            page templates built from content.js
    app.js              behaviour: routing, animations, scroll effects, forms
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

## Accessibility and motion

Visitors with "reduce motion" turned on get a calm version: no intro, smooth scrolling, scroll effects or page veil. The photo that follows the pointer on the houses page only turns on for mouse or trackpad users. The gallery viewer works with arrow keys, Escape and swipes.
