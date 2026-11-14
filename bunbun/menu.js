/* THE BUN BUN MENU: edit this file to change what the site shows.
   Each item:  id (unique), name, desc, price (rupees, a draft figure), unit, type (which dessert is drawn), opts (how it looks).
   Types: cheesecake, flan, glass, pops, brownie, cupcake, macarons, donut, cookies, tart, eclair, jar
   To remove an item, delete its line. To add one, copy a line and change the id, name, price and opts. */
export const MENU = [
  { cat: 'Cheesecakes', blurb: 'Baked slowly and set overnight, on a buttery biscuit base.', items: [
    { id: 'cc-ny', name: 'Classic New York', desc: 'Dense, creamy and lightly tangy with a golden top.', price: 220, unit: 'slice', type: 'cheesecake', opts: { fill: '#f6ecd6', garnish: ['strawberry', 'mint'] } },
    { id: 'cc-blue', name: 'Blueberry', desc: 'Vanilla cheesecake under glossy blueberry compote.', price: 240, unit: 'slice', type: 'cheesecake', opts: { fill: '#f7eed8', top: '#2d2a6b', ribbon: '#6b3f91', garnish: ['blueberry'] } },
    { id: 'cc-straw', name: 'Strawberry', desc: 'Fresh strawberry glaze and sliced berries.', price: 240, unit: 'slice', type: 'cheesecake', opts: { fill: '#f9eadf', top: '#d2182f', garnish: ['strawberry', 'mint'] } },
    { id: 'cc-biscoff', name: 'Biscoff', desc: 'Caramelised biscuit spread, crumble on top.', price: 260, unit: 'slice', type: 'cheesecake', opts: { fill: '#e9cfa6', top: '#a8631f', crust: '#8b5a2b', garnish: ['crumble'] } },
    { id: 'cc-mango', name: 'Mango', desc: 'Alphonso mango layer with fresh mango cubes.', price: 250, unit: 'slice', type: 'cheesecake', opts: { fill: '#fbe7b0', top: '#f2a817', garnish: ['mango', 'mint'] } },
    { id: 'cc-choc', name: 'Dark Chocolate', desc: 'Rich chocolate cheesecake with a ganache top.', price: 260, unit: 'slice', type: 'cheesecake', opts: { fill: '#6b3e2b', top: '#2a150d', crust: '#4a2a1a', garnish: ['chocolate'] } }
  ] },
  { cat: 'Puddings', blurb: 'Spoon desserts, made fresh each morning.', items: [
    { id: 'pd-flan', name: 'Caramel Custard', desc: 'Silky egg custard under dark caramel.', price: 140, unit: 'cup', type: 'flan', opts: { body: '#f2cf86', sauce: '#a85a14', garnish: 'cream' } },
    { id: 'pd-choc', name: 'Chocolate Pot', desc: 'Dark chocolate pudding with whipped cream.', price: 160, unit: 'cup', type: 'glass', opts: { layers: [['#2d160d', 1.1, 'sauce'], ['#4a2616', .9]], top: 'cream', garnish: ['chocolate'] } },
    { id: 'pd-mango', name: 'Mango Panna Cotta', desc: 'Vanilla panna cotta set under mango purée.', price: 170, unit: 'cup', type: 'glass', opts: { layers: [['#fbf3e0', 1.1], ['#f4a91c', .9, 'sauce']], garnish: ['mango', 'mint'] } },
    { id: 'pd-berry', name: 'Berry Panna Cotta', desc: 'Cream panna cotta with a mixed berry coulis.', price: 170, unit: 'cup', type: 'glass', opts: { layers: [['#fbf3e0', 1.1], ['#b0203f', .8, 'sauce']], garnish: ['blueberry', 'mint'] } },
    { id: 'pd-banoffee', name: 'Banoffee Pudding', desc: 'Biscuit, toffee, banana and cream in layers.', price: 180, unit: 'cup', type: 'glass', opts: { layers: [['#a9763d', .7, 'crumb'], ['#c98a3c', .55, 'sauce'], ['#f1dca0', .8], ['#fffaf0', .8]], top: 'cream', garnish: ['chocolate'] } },
    { id: 'pd-sticky', name: 'Sticky Toffee', desc: 'Warm date sponge with butterscotch sauce.', price: 190, unit: 'cup', type: 'flan', opts: { body: '#6a3f1f', sauce: '#c98a3c', garnish: 'mint' } }
  ] },
  { cat: 'Brownies', blurb: 'Fudgy in the middle, crackled on top.', items: [
    { id: 'br-classic', name: 'Classic Fudge', desc: 'Dense, dark and sprinkled with sea salt.', price: 90, unit: 'piece', type: 'brownie', opts: { topping: 'sugar' } },
    { id: 'br-walnut', name: 'Walnut', desc: 'Toasted walnuts through a rich chocolate base.', price: 110, unit: 'piece', type: 'brownie', opts: { topping: 'walnut' } },
    { id: 'br-caramel', name: 'Salted Caramel', desc: 'Buttery caramel swirled and drizzled over.', price: 120, unit: 'piece', type: 'brownie', opts: { topping: 'caramel' } },
    { id: 'br-hazel', name: 'Hazelnut Swirl', desc: 'Chocolate hazelnut ribbon baked through.', price: 120, unit: 'piece', type: 'brownie', opts: { topping: 'swirl' } }
  ] },
  { cat: 'Cupcakes', blurb: 'Soft sponge, piped swirls, made to order.', items: [
    { id: 'cu-van', name: 'Vanilla Cherry', desc: 'Vanilla sponge, buttercream swirl, a cherry.', price: 95, unit: 'piece', type: 'cupcake', opts: { liner: '#bccbe6', sponge: '#ecc983', frost: '#f7f0e4', garnish: 'cherry' } },
    { id: 'cu-choc', name: 'Chocolate Ganache', desc: 'Chocolate sponge with a glossy ganache heart.', price: 105, unit: 'piece', type: 'cupcake', opts: { liner: '#8a6a58', sponge: '#4a2a1e', frost: '#6e4636', garnish: 'ganache' } },
    { id: 'cu-red', name: 'Red Velvet', desc: 'Cocoa-red sponge, cream cheese frosting.', price: 110, unit: 'piece', type: 'cupcake', opts: { liner: '#e6c9d3', sponge: '#8f1d2e', frost: '#fbf4ea', garnish: 'sprinkles' } },
    { id: 'cu-lemon', name: 'Lemon Blueberry', desc: 'Zesty sponge with blueberries on lemon cream.', price: 105, unit: 'piece', type: 'cupcake', opts: { liner: '#f1e6a8', sponge: '#f3e08a', frost: '#fbf6dd', garnish: 'blueberry' } }
  ] },
  { cat: 'Cake pops', blurb: 'Bite-sized cake on a stick, dipped and finished by hand.', items: [
    { id: 'cp-pink', name: 'Strawberry Cream', desc: 'Vanilla cake and strawberry coating.', price: 60, unit: 'pop', type: 'pops', opts: { colors: ['#f2a7be', '#f2a7be', '#f4b8c8'], sprinkles: true } },
    { id: 'cp-choc', name: 'Double Chocolate', desc: 'Chocolate cake in dark chocolate.', price: 65, unit: 'pop', type: 'pops', opts: { colors: ['#3a1f14', '#4a2a1a', '#3a1f14'], drizzle: '#f6efe0' } },
    { id: 'cp-red', name: 'Red Velvet', desc: 'Red velvet cake in white chocolate.', price: 65, unit: 'pop', type: 'pops', opts: { colors: ['#fbf3e8', '#fbf3e8', '#f4e4e4'], drizzle: '#a31d3a' } },
    { id: 'cp-blue', name: 'Blueberry Blue', desc: 'Blueberry cake in sky-blue coating.', price: 65, unit: 'pop', type: 'pops', opts: { colors: ['#aab6cc', '#bccbe6', '#aab6cc'], sprinkles: true } }
  ] },
  { cat: 'Macarons & cookies', blurb: 'Crisp shells, soft centres, chewy edges.', items: [
    { id: 'mc-rose', name: 'Rose Macarons', desc: 'Rose cream between pink shells.', price: 70, unit: 'piece', type: 'macarons', opts: { colors: ['#f4b8c8', '#f6cfd8', '#f4b8c8'], filling: '#f9e6ea' } },
    { id: 'mc-pista', name: 'Pistachio Macarons', desc: 'Pistachio cream and a nutty shell.', price: 70, unit: 'piece', type: 'macarons', opts: { colors: ['#b9d8a3', '#c8e0b2', '#b9d8a3'], filling: '#e9efcf' } },
    { id: 'mc-caramel', name: 'Salted Caramel Macarons', desc: 'Caramel ganache between golden shells.', price: 75, unit: 'piece', type: 'macarons', opts: { colors: ['#e0b070', '#e8c088', '#e0b070'], filling: '#b4742a' } },
    { id: 'ck-choc', name: 'Chocolate Chip Cookie', desc: 'Chewy edges, melting chunks of dark chocolate.', price: 80, unit: 'piece', type: 'cookies', opts: { dough: '#c58a4a', chips: '#2c170c' } },
    { id: 'ck-double', name: 'Double Chocolate Cookie', desc: 'Cocoa dough and white chocolate chunks.', price: 85, unit: 'piece', type: 'cookies', opts: { dough: '#5a3322', chips: '#f4ead4' } },
    { id: 'ck-oat', name: 'Oatmeal Raisin Cookie', desc: 'Oats, cinnamon and plump raisins.', price: 75, unit: 'piece', type: 'cookies', opts: { dough: '#c99a5c', chips: '#4a2a3a' } }
  ] },
  { cat: 'Donuts & éclairs', blurb: 'Filled, glazed and finished while fresh.', items: [
    { id: 'dn-pink', name: 'Strawberry Glaze Donut', desc: 'Soft yeast donut, pink glaze, sprinkles.', price: 90, unit: 'piece', type: 'donut', opts: { glaze: '#f2a7be', sprinkles: true } },
    { id: 'dn-choc', name: 'Chocolate Donut', desc: 'Dark chocolate glaze with a cream drizzle.', price: 95, unit: 'piece', type: 'donut', opts: { glaze: '#3a1f13', drizzle: '#f7f0e4' } },
    { id: 'dn-blue', name: 'Sky Glaze Donut', desc: 'Vanilla glaze in Bun Bun blue.', price: 90, unit: 'piece', type: 'donut', opts: { glaze: '#aab6cc', sprinkles: true } },
    { id: 'ec-choc', name: 'Chocolate Éclair', desc: 'Choux filled with vanilla cream, dark glaze.', price: 130, unit: 'piece', type: 'eclair', opts: { glaze: '#3a1f13', drizzle: '#f7f0e4' } },
    { id: 'ec-pista', name: 'Pistachio Éclair', desc: 'Pistachio cream, green glaze and crushed nuts.', price: 140, unit: 'piece', type: 'eclair', opts: { glaze: '#a8c27a', nuts: true } }
  ] },
  { cat: 'Tarts & jars', blurb: 'Crisp pastry shells and layered desserts to go.', items: [
    { id: 'tt-lemon', name: 'Lemon Meringue Tart', desc: 'Sharp lemon curd under toasted meringue.', price: 170, unit: 'piece', type: 'tart', opts: { fill: '#f6d63a', garnish: 'meringue' } },
    { id: 'tt-berry', name: 'Fresh Berry Tart', desc: 'Vanilla cream and a crown of fresh berries.', price: 190, unit: 'piece', type: 'tart', opts: { fill: '#f8efd8', garnish: 'berries', glossy: false } },
    { id: 'tt-choc', name: 'Dark Chocolate Tart', desc: 'Silky ganache in a cocoa pastry shell.', price: 180, unit: 'piece', type: 'tart', opts: { fill: '#2a150d', shell: '#8a5a32', garnish: 'cocoa' } },
    { id: 'tm-classic', name: 'Classic Tiramisu', desc: 'Coffee-soaked sponge, mascarpone and cocoa.', price: 190, unit: 'cup', type: 'jar', opts: { layers: [['#fbf3e0', .8], ['#a9763d', .5, 'crumb'], ['#fbf3e0', .8], ['#a9763d', .5, 'crumb']], top: 'cocoa' } },
    { id: 'jr-red', name: 'Red Velvet Jar', desc: 'Red velvet sponge and cream cheese layers.', price: 170, unit: 'jar', type: 'jar', opts: { layers: [['#8f1d2e', .8], ['#fbf3e0', .6], ['#8f1d2e', .8], ['#fbf3e0', .6]], top: 'cream', garnish: ['strawberry'] } },
    { id: 'jr-choc', name: 'Brownie Jar', desc: 'Brownie, chocolate cream and crunch.', price: 170, unit: 'jar', type: 'jar', opts: { layers: [['#3a1f13', .8], ['#8a6048', .5], ['#3a1f13', .8], ['#8a6048', .5]], top: 'cream', garnish: ['chocolate'] } }
  ] }
];
