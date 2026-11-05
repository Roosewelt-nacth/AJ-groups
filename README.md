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
    styles.css          base design system: colours, type, buttons, hero, sections
    sections.css        newer sections: bottom dock, chapters, orbit, business-page extras
  js/
    content.js          ALL editable text, contact details, businesses, ventures, colours
    pages.js            page templates built from content.js
    app.js              behaviour: routing, animations, scroll effects, forms
```

## Updating details (you only need `assets/js/content.js`)

| What you want to change | Where in `content.js` |
|---|---|
| Email, phone, location, social links, footer note | `SITE` |
| Hero intro text, tags, rotating words, big statement | `HERO` |
| Messages in the hero "what our brands are up to" card | `HERO_NOTES` |
| A business's name, description, services, colours | `BUSINESSES` |
| Upcoming ventures | `VENTURES` |
| Story, mission, vision, approach | `ABOUT` |
| Values | `VALUES` |
| "Why AJ GROUPS" points | `WHY_POINTS` |
| Partnership types (also fills the form dropdown) | `PARTNERSHIP_TYPES` |

Lines marked `// TODO` are placeholders waiting for real details.

**Add a business:** copy one `{ ... }` block in `BUSINESSES`, paste it after the last one, then change the `id` (lowercase, no spaces) and the values. Its card, home-page chapter, orbit node, footer link and its own page are all created automatically.

**Social links:** put the full URL in `url`. While a URL is empty, the link shows as "link to be added".

**Images:** every photo is set in `content.js`: `IMAGES` for the about, partnerships and contact pages, `image` and `gallery` on each business, and `image` on each venture. They're currently free stock photos from Unsplash (free to use under the [Unsplash License](https://unsplash.com/license)). To use your own, drop the files in `assets/img/` and replace the value with a path, for example `image: 'assets/img/bakery-cover.jpg'`.

## Not done yet

- **Forms:** the forms check what's typed, but they aren't connected to a backend, so nothing is sent. Hook them up to a form service (for example Formspree or Netlify Forms) or an email API before launch.
- **Gallery images:** the business-page galleries show sample stock photos, not real work. Replace them before launch.

## Accessibility and motion

Visitors with "reduce motion" turned on get a calm version: no smooth scrolling, scroll effects or animated transitions. The custom cursor, tilting cards and magnetic buttons only turn on for mouse or trackpad users.
