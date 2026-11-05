/* =====================================================================
   AJ GROUPS — SITE CONTENT
   ---------------------------------------------------------------------
   This is the only file you need to edit to change words, contact
   details, businesses, ventures or colours. Save it and refresh the page.

   Tips
   · Keep the quotes and commas exactly as they are around each value.
   · Use ’ (curly apostrophe) or \' inside text wrapped in single quotes.
   · To add a business or venture, copy one { ... } block, paste it
     after the last one (with a comma between) and change the values.
   ===================================================================== */


/* ---------- Images ----------
   Any image can be a web address or a local file, e.g. 'assets/img/bakery-cover.jpg'.
   U('photo-…') is just a shortcut for a free Unsplash stock photo (unsplash.com/license).
   Replace the stock photos with your own when you have them. */
const U = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

const IMAGES = {
  about:        U('photo-1521737852567-6949f3f9f2b5'),   // people working together at a table
  partnerships: U('photo-1521791136064-7986c2920216'),   // handshake
  contact:      U('photo-1576057122708-9608db46b2f3'),   // laptop and mouse on a clean desk
};


/* ---------- 1. Company details (footer + contact page) ---------- */
const SITE = {
  name: 'AJ GROUPS',
  tagline: 'Building Businesses. Creating Opportunities.',
  email: 'hello@ajgroups.example',        // TODO: real email
  phone: '+00 00000 00000',               // TODO: real phone number
  location: 'Location to be added',       // TODO: city / address
  // Leave url empty ('') until the account exists; it will show as "link to be added".
  socials: [
    { label: 'Instagram', url: '' },
    { label: 'LinkedIn',  url: '' },
    { label: 'YouTube',   url: '' },
    { label: 'Facebook',  url: '' },
  ],
  footerNote: 'Placeholder contact details. Replace before launch.',
  copyrightYear: 2026,
};


/* ---------- 2. Home page hero ---------- */
const HERO = {
  tags: ['5 brands · 1 group', 'Marketing · Visuals · Tech · Food · Kids'],
  intro: 'We start businesses, give each one its own personality, and help it grow. Right now that’s marketing, photography, software, a bakery and stories for kids.',
  // "Creating ___" cycles through these words. Colour = the brand it stands for.
  rotatingWords: [
    { word: 'opportunities.', color: '#e5383b' },
    { word: 'brands.',        color: '#3b5bea' },
    { word: 'visuals.',       color: '#e08a12' },
    { word: 'software.',      color: '#0e9f9a' },
    { word: 'bakes.',         color: '#e8553a' },
    { word: 'stories.',       color: '#c94a9f' },
  ],
  statement: 'AJ GROUPS is an emerging multi-business group that builds and manages *independent brands* across digital marketing, visual production, technology, food and digital entertainment. *Fashion and digital products* are next.',
};

/* Messages that drop into the card on the right of the hero.
   Use `business:` with a business id, or give a venture its own name/colours. */
const HERO_NOTES = [
  { business: 'alven-studio',           text: 'Helping businesses show up online. Branding, socials, campaigns.' },
  { business: 'house-of-fovo',          text: 'Photos and videos of the moments people want to keep.' },
  { business: 'aj-software-solutions',  text: 'Websites and apps that actually fit the business.' },
  { business: 'bun-bun-bakes',          text: 'Brownies, waffles, caramel pudding. Hot chocolate too.' },
  { business: 'aj-little-wonder-world', text: 'Stories and animations for kids, with some learning mixed in.' },
  { name: 'Clothing Brand',   tag: 'Soon',         monogram: 'CB', colors: ['#a78bfa', '#7c5cf0', '#ffffff'], text: 'A clothing label is in the works.' },
  { name: 'Digital Products', tag: 'In the works', monogram: 'DP', colors: ['#d4ff3f', '#a8e021', '#0b0b10'], text: 'E-books, planners and templates. Being made now.' },
  { name: 'Online Courses',   tag: 'Soon',         monogram: 'OC', colors: ['#ff6b4a', '#ffb23f', '#1c0906'], text: 'Courses on design, baking and more.' },
];


/* ---------- 3. Businesses ----------
   id ............ used in the page address (#alven-studio). Lowercase, no spaces.
   colors.main / colors.second ... the brand's two colours
   colors.text ... text colour that reads well on those colours
   colors.light .. lighter tint used on dark backgrounds
   image ......... cover photo (cards, home-page chapter, business page)
   gallery ....... photos for the gallery section; galleryTitle '' hides it */
const BUSINESSES = [
  {
    id: 'alven-studio',
    name: 'ALVEN STUDIO', shortName: 'Alven Studio', monogram: 'AS', tag: 'Marketing',
    category: 'Digital Marketing & Creative Solutions',
    colors: { main: '#4c6fff', second: '#2a3fd8', text: '#ffffff', light: '#8ea2ff' },
    summary: 'A creative digital marketing agency helping businesses build their online presence and grow their audience.',
    description: 'A creative digital marketing agency focused on helping businesses build their online presence, strengthen their brand identity and grow their audience.',
    listTitle: 'Services', listHeading: 'What we do.',
    items: ['Digital Marketing', 'Social Media Management', 'Content Creation', 'Graphic Design', 'Branding', 'Video Editing', 'Digital Campaign Management'],
    image: U('photo-1563986768494-4dee2763ff3f'),
    galleryTitle: 'Portfolio',
    gallery: ['photo-1505209487757-5114235191e5', 'photo-1759215524472-1b0686fdbd87', 'photo-1524993242431-9de0d2d86e85', 'photo-1553877522-43269d4ea984', 'photo-1555960840-f536ae1e4e95', 'photo-1576057121845-85eca73ce825'].map(id => U(id, 900)),
  },
  {
    id: 'house-of-fovo',
    name: 'HOUSE OF FOVO', shortName: 'House of Fovo', monogram: 'HF', tag: 'Visuals',
    category: 'Photography & Videography',
    colors: { main: '#ffb23f', second: '#ff8a1f', text: '#1a1205', light: '#ffc56b' },
    summary: 'A creative visual production brand capturing meaningful moments and creating engaging visual content.',
    description: 'A creative visual production brand focused on capturing meaningful moments and creating engaging visual content.',
    listTitle: 'Services', listHeading: 'What we capture.',
    items: ['Professional Photography', 'Event Photography', 'Videography', 'Promotional Videos', 'Reels and Short-form Videos', 'Video Editing', 'Creative Visual Content'],
    image: U('photo-1516961642265-531546e84af2'),
    galleryTitle: 'Gallery',
    gallery: ['photo-1650017067760-f115df08b271', 'photo-1579724186435-56a4bd84ab31', 'photo-1650017069617-61720acdd884', 'photo-1635444344034-17bf0081e9c0', 'photo-1650017069118-2ebf45880fbf', 'photo-1650017067794-80fd3a99a104'].map(id => U(id, 900)),
  },
  {
    id: 'aj-software-solutions',
    name: 'AJ SOFTWARE SOLUTIONS', shortName: 'AJ Software', monogram: 'SW', tag: 'Technology',
    category: 'Technology & Software Development',
    colors: { main: '#20d3c2', second: '#0e9f9a', text: '#04201d', light: '#4fe3d4' },
    summary: 'A technology-focused venture delivering practical digital solutions for businesses and individuals.',
    description: 'A technology-focused venture delivering practical digital solutions for businesses and individuals.',
    listTitle: 'Services', listHeading: 'What we build.',
    items: ['Website Development', 'Application Development', 'Custom Software Development', 'Business Website Solutions', 'Digital Product Development'],
    image: U('photo-1505685296765-3a2736de412f'),
    galleryTitle: 'In the studio',
    gallery: ['photo-1566915896913-549d796d2166', 'photo-1591206246042-2ed5fec8f27e', 'photo-1551033406-611cf9a28f67', 'photo-1634634465913-5bb5600942f2', 'photo-1641247530898-ed6b1b5215eb', 'photo-1521185496955-15097b20c5fe'].map(id => U(id, 900)),
  },
  {
    id: 'bun-bun-bakes',
    name: 'BUN BUN BAKES', shortName: 'Bun Bun Bakes', monogram: 'BB', tag: 'Food',
    category: 'Bakery & Food Products',
    colors: { main: '#ff6b4a', second: '#ff4f6d', text: '#1c0906', light: '#ff8a70' },
    summary: 'A food and bakery brand creating delicious baked products, desserts and snack offerings.',
    description: 'A food and bakery brand focused on creating delicious baked products, desserts and snack offerings.',
    listTitle: 'Products', listHeading: 'From our kitchen.',
    items: ['Brownies', 'Waffles', 'French Fries', 'Nuggets', 'Caramel Pudding', 'Hot Chocolate'],
    image: U('photo-1515037893149-de7f840978e2'),
    galleryTitle: 'From the kitchen',
    gallery: ['photo-1606313564200-e75d5e30476c', 'photo-1562376552-0d160a2f238d', 'photo-1542990253-0d0f5be5f0ed', 'photo-1558584724-0e4d32ca55a4', 'photo-1762922425478-7049c54bfbec', 'photo-1637572815755-c4b80092dce1'].map(id => U(id, 900)),
  },
  {
    id: 'aj-little-wonder-world',
    name: 'AJ LITTLE WONDER WORLD', shortName: 'Little Wonder World', monogram: 'LW', tag: 'Kids',
    category: 'Kids’ Entertainment & Digital Content',
    colors: { main: '#ff7ad1', second: '#a78bfa', text: '#1b0b24', light: '#ff9adf' },
    summary: 'A children’s content initiative creating entertaining and engaging digital stories, animations and educational content.',
    description: 'A children’s content initiative focused on creating entertaining and engaging digital stories, animations and educational content.',
    listTitle: 'What we create', listHeading: 'Made for young minds.',
    items: ['Digital Stories', 'Animations', 'Educational Content'],
    image: U('photo-1545558014-8692077e9b5c'),
    galleryTitle: 'Content showcase',
    gallery: ['photo-1583437871198-367d5df85c8c', 'photo-1592471557329-b81d35d1bb15', 'photo-1455884981818-54cb785db6fc', 'photo-1497633762265-9d179a990aa6', 'photo-1618842676088-c4d48a6a7c9d', 'photo-1782150924537-7a4fe94d837f'].map(id => U(id, 900)),
  },
];


/* ---------- 4. Upcoming ventures ---------- */
const VENTURES = [
  { name: 'Clothing Brand', status: 'Coming soon', color: '#a78bfa', image: U('photo-1603400521630-9f2de124b33b', 900),
    summary: 'A future fashion and clothing business.', items: [] },
  { name: 'Digital Products', status: 'In development', color: '#d4ff3f', image: U('photo-1632772998001-cc9bf6f7c852', 900),
    summary: 'E-books, planners, templates and personalised digital gifts.',
    items: ['E-books', 'Children’s Storybooks', 'Colouring Books', 'Wedding Planners', 'Financial Planners', 'Digital Templates', 'Printable Products', 'Personalised Digital Gifts'] },
  { name: 'Online Courses & Training', status: 'Coming soon', color: '#ff6b4a', image: U('photo-1501504905252-473c47e087f8', 900),
    summary: 'Graphic design, baking, Microsoft Business Central and more.',
    items: ['Graphic Design', 'Baking', 'Microsoft Business Central', 'Other skill-development courses'] },
];


/* ---------- 5. About page ---------- */
const ABOUT = {
  intro: 'An emerging multi-business group focused on developing independent brands and businesses across diverse industries.',
  story: 'AJ GROUPS began with an entrepreneurial vision to create and develop multiple business opportunities under one common business identity.',
  mission: 'To build and support independent businesses through innovation, quality, collaboration and sustainable business practices.',
  vision: 'To establish AJ GROUPS as a diversified business group with a portfolio of trusted brands across multiple industries.',
  approach: 'Every business under AJ GROUPS has its own identity, direction and growth strategy while contributing to the shared vision of the parent group.',
};

const VALUES = [
  { name: 'Innovation',    color: '#4c6fff' },
  { name: 'Integrity',     color: '#20d3c2' },
  { name: 'Collaboration', color: '#ff7ad1' },
  { name: 'Quality',       color: '#ffb23f' },
  { name: 'Growth',        color: '#d4ff3f' },
];


/* ---------- 6. "Why AJ GROUPS" notes (home page board + hero strip) ---------- */
const WHY_POINTS = [
  { title: 'Independent identities', text: 'Each business keeps its own identity, direction and growth strategy.', icon: 'home' },
  { title: 'One shared vision',      text: 'Every brand contributes to the long-term goals of the parent group.', icon: 'target' },
  { title: 'Quality first',          text: 'Care and consistency in every industry we enter.',                    icon: 'check' },
  { title: 'Built to collaborate',   text: 'Open to partners, freelancers and project teams.',                    icon: 'people' },
  { title: 'Room to grow',           text: 'A structure designed to add new businesses over time.',               icon: 'growth' },
];


/* ---------- 7. Partnerships page ---------- */
const PARTNERSHIP_TYPES = [
  { title: 'Business Partnerships',              text: 'Long-term collaborations with other businesses.',   option: 'Business Partnership' },
  { title: 'Freelance Collaborations',           text: 'Skilled freelancers working with our brands.',      option: 'Freelance Collaboration' },
  { title: 'Project-based Partnerships',         text: 'Focused partnerships for specific projects.',       option: 'Project-based Partnership' },
  { title: 'Professional Collaborations',        text: 'Working with experts across disciplines.',          option: 'Professional Collaboration' },
  { title: 'Business Development Opportunities', text: 'Exploring new markets and ideas together.',         option: 'Business Development' },
];
