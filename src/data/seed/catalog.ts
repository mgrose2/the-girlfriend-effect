/**
 * The hardcoded catalog. There are no retailer APIs and there will not be —
 * see CLAUDE.md. Items are fiction chosen to look plausible next to each
 * retailer's real range, and to give the tag and size filters something to
 * actually bite on.
 *
 * Two data conventions the matching rules depend on:
 *
 * - Every `bottom` is sized waist x inseam (`'32x32'`), including sweats and
 *   joggers that a real retailer would sell as S/M/L. Plan §4 defines the
 *   bottom size check as waist + inseam, so the catalog is kept consistent
 *   with that rather than the other way round.
 * - Shorts are absent for the same reason: their inseam would never match a
 *   recipient's trouser inseam, so they would silently never surface.
 *
 * Sizes are deliberately uneven across items — a catalog where everything
 * comes in every size would make the size filter untestable in QA.
 */

import type { CatalogItem } from '../../domain';

const ONE_SIZE = ['OS'];

/**
 * Placeholder imagery. Still not real product photography — that has to be
 * sourced before the test round, since a shop full of grey boxes cannot tell
 * us anything about whether recipients buy.
 *
 * The `.png` is load-bearing: placehold.co serves SVG by default, and React
 * Native's Image cannot render SVG, so the extensionless URL produced blank
 * tiles on device while failing silently.
 */
function placeholder(name: string): string {
  return `https://placehold.co/600x800/EFE0D9/1C1917.png?text=${encodeURIComponent(name)}`;
}

type SeedItem = Omit<CatalogItem, 'imageUrl'> & {
  /** Set once real photography exists; falls back to a named grey box. */
  imageUrl?: string;
};

const SEED: SeedItem[] = [
  // ---- H&M — budget basics, minimal and streetwear leaning ----
  {
    id: 'hm-oxford-shirt',
    retailer: 'H&M',
    name: 'Relaxed Fit Oxford Shirt',
    price: 29.99,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['minimal', 'preppy'],
  },
  {
    id: 'hm-loose-hoodie',
    retailer: 'H&M',
    name: 'Loose Fit Hoodie',
    price: 34.99,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['streetwear'],
  },
  {
    id: 'hm-cotton-tee',
    retailer: 'H&M',
    name: 'Cotton Crew Neck Tee',
    price: 12.99,
    category: 'top',
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL'],
    tags: ['minimal'],
  },
  {
    id: 'hm-regular-chinos',
    retailer: 'H&M',
    name: 'Regular Fit Chinos',
    price: 39.99,
    category: 'bottom',
    sizesAvailable: ['30x30', '30x32', '32x30', '32x32', '34x32'],
    tags: ['minimal', 'preppy'],
  },
  {
    id: 'hm-cargo-trousers',
    retailer: 'H&M',
    name: 'Wide Leg Cargo Trousers',
    price: 44.99,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x32', '34x32', '36x32'],
    tags: ['streetwear'],
  },
  {
    id: 'hm-chunky-sneaker',
    retailer: 'H&M',
    name: 'Chunky Sole Sneakers',
    price: 49.99,
    category: 'shoes',
    sizesAvailable: ['8', '9', '10', '11', '12'],
    tags: ['streetwear'],
  },
  {
    id: 'hm-ribbed-beanie',
    retailer: 'H&M',
    name: 'Ribbed Beanie',
    price: 9.99,
    category: 'accessory',
    sizesAvailable: ONE_SIZE,
    tags: ['streetwear', 'minimal'],
  },

  // ---- Uniqlo — minimal, the basics engine ----
  {
    id: 'uq-supima-tee',
    retailer: 'Uniqlo',
    name: 'Supima Cotton Crew Neck T-Shirt',
    price: 19.9,
    category: 'top',
    sizesAvailable: ['XS', 'S', 'M', 'L', 'XL'],
    tags: ['minimal'],
  },
  {
    id: 'uq-oversized-sweatshirt',
    retailer: 'Uniqlo',
    name: 'U Oversized Sweatshirt',
    price: 39.9,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L'],
    tags: ['minimal', 'streetwear'],
  },
  {
    id: 'uq-merino-crew',
    retailer: 'Uniqlo',
    name: 'Merino Crew Neck Sweater',
    price: 49.9,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['minimal', 'old money'],
  },
  {
    id: 'uq-ankle-trousers',
    retailer: 'Uniqlo',
    name: 'Smart Ankle Trousers',
    price: 49.9,
    category: 'bottom',
    sizesAvailable: ['30x30', '32x30', '32x32', '34x32'],
    tags: ['minimal', 'workwear'],
  },
  {
    id: 'uq-selvedge-jeans',
    retailer: 'Uniqlo',
    name: 'Slim Fit Selvedge Jeans',
    price: 59.9,
    category: 'bottom',
    sizesAvailable: ['28x30', '30x32', '32x32', '34x32'],
    tags: ['minimal', 'workwear'],
  },
  {
    id: 'uq-light-down',
    retailer: 'Uniqlo',
    name: 'Ultra Light Down Jacket',
    price: 69.9,
    category: 'outerwear',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['minimal'],
  },

  // ---- Abercrombie — preppy with a streetwear edge ----
  {
    id: 'af-essential-tee',
    retailer: 'Abercrombie',
    name: 'Essential Crew Tee',
    price: 18.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['preppy', 'minimal'],
  },
  {
    id: 'af-rugby-polo',
    retailer: 'Abercrombie',
    name: 'Vintage Wash Rugby Polo',
    price: 48.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L'],
    tags: ['preppy', 'old money'],
  },
  {
    id: 'af-carpenter-jean',
    retailer: 'Abercrombie',
    name: 'Baggy Carpenter Jean',
    price: 80.0,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x32', '34x32', '36x32'],
    tags: ['streetwear', 'workwear'],
  },
  {
    id: 'af-straight-jean',
    retailer: 'Abercrombie',
    name: 'Athletic Straight Jean',
    price: 80.0,
    category: 'bottom',
    sizesAvailable: ['30x30', '32x30', '32x32', '34x32'],
    tags: ['preppy'],
  },
  {
    id: 'af-sherpa-trucker',
    retailer: 'Abercrombie',
    name: 'Sherpa Lined Trucker Jacket',
    price: 120.0,
    category: 'outerwear',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['workwear', 'streetwear'],
  },
  {
    id: 'af-canvas-lowtop',
    retailer: 'Abercrombie',
    name: 'Canvas Low Top',
    price: 60.0,
    category: 'shoes',
    sizesAvailable: ['8', '8.5', '9', '9.5', '10', '11'],
    tags: ['preppy', 'minimal'],
  },
  {
    id: 'af-web-belt',
    retailer: 'Abercrombie',
    name: 'Canvas Web Belt',
    price: 28.0,
    category: 'accessory',
    sizesAvailable: ONE_SIZE,
    tags: ['preppy'],
  },

  // ---- J.Crew — old money, preppy, a little workwear ----
  {
    id: 'jc-broken-in-oxford',
    retailer: 'J.Crew',
    name: 'Broken-in Oxford Shirt',
    price: 89.5,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['old money', 'preppy'],
  },
  {
    id: 'jc-cashmere-crew',
    retailer: 'J.Crew',
    name: 'Cashmere Crewneck Sweater',
    price: 198.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L'],
    tags: ['old money', 'minimal'],
  },
  {
    id: 'jc-484-chino',
    retailer: 'J.Crew',
    name: '484 Slim-fit Chino',
    price: 98.0,
    category: 'bottom',
    sizesAvailable: ['28x30', '30x30', '30x32', '32x30', '32x32', '34x32'],
    tags: ['preppy', 'old money'],
  },
  {
    id: 'jc-chore-coat',
    retailer: 'J.Crew',
    name: 'Wallace & Barnes Chore Coat',
    price: 168.0,
    category: 'outerwear',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['workwear'],
  },
  {
    id: 'jc-quilted-vest',
    retailer: 'J.Crew',
    name: 'Harbor Quilted Vest',
    price: 138.0,
    category: 'outerwear',
    sizesAvailable: ['M', 'L', 'XL'],
    tags: ['old money', 'preppy'],
  },
  {
    id: 'jc-penny-loafer',
    retailer: 'J.Crew',
    name: 'Leather Penny Loafer',
    price: 198.0,
    category: 'shoes',
    sizesAvailable: ['8', '9', '9.5', '10', '10.5', '11', '12'],
    tags: ['old money', 'preppy'],
  },
  {
    id: 'jc-silk-knit-tie',
    retailer: 'J.Crew',
    name: 'Silk Knit Tie',
    price: 69.5,
    category: 'accessory',
    sizesAvailable: ONE_SIZE,
    tags: ['old money'],
  },

  // ---- Lululemon — athleisure, the whole range ----
  {
    id: 'll-metal-vent-tech',
    retailer: 'Lululemon',
    name: 'Metal Vent Tech Short Sleeve',
    price: 88.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['athleisure'],
  },
  {
    id: 'll-steady-state-crew',
    retailer: 'Lululemon',
    name: 'Steady State Crew Sweatshirt',
    price: 118.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L'],
    tags: ['athleisure'],
  },
  {
    id: 'll-surge-half-zip',
    retailer: 'Lululemon',
    name: 'Surge Warm Half Zip',
    price: 128.0,
    category: 'top',
    sizesAvailable: ['M', 'L', 'XL'],
    tags: ['athleisure'],
  },
  {
    id: 'll-abc-trouser',
    retailer: 'Lululemon',
    name: 'ABC Classic-Fit Trouser',
    price: 128.0,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x30', '32x32', '34x32', '36x32'],
    tags: ['athleisure', 'workwear'],
  },
  {
    id: 'll-commission-pant',
    retailer: 'Lululemon',
    name: 'Commission Slim-Fit Pant',
    price: 128.0,
    category: 'bottom',
    sizesAvailable: ['30x30', '32x30', '32x32', '34x32'],
    tags: ['athleisure', 'workwear', 'minimal'],
  },
  {
    id: 'll-down-for-it-all',
    retailer: 'Lululemon',
    name: 'Down For It All Jacket',
    price: 248.0,
    category: 'outerwear',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['athleisure'],
  },
  {
    id: 'll-beyondfeel-trainer',
    retailer: 'Lululemon',
    name: 'Beyondfeel Running Shoe',
    price: 148.0,
    category: 'shoes',
    sizesAvailable: ['8.5', '9', '9.5', '10', '10.5', '11'],
    tags: ['athleisure'],
  },

  // ---- Kith — streetwear, priced like it ----
  {
    id: 'kith-classic-hoodie',
    retailer: 'Kith',
    name: 'Kith Classic Logo Hoodie',
    price: 180.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['streetwear'],
  },
  {
    id: 'kith-cyber-tee',
    retailer: 'Kith',
    name: 'Kith Box Logo Tee',
    price: 65.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L'],
    tags: ['streetwear'],
  },
  {
    id: 'kith-williams-pant',
    retailer: 'Kith',
    name: 'Williams III Pant',
    price: 150.0,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x32', '34x32'],
    tags: ['streetwear', 'athleisure'],
  },
  {
    id: 'kith-bleecker-denim',
    retailer: 'Kith',
    name: 'Bleecker Denim',
    price: 195.0,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x30', '32x32', '34x32'],
    tags: ['streetwear'],
  },
  {
    id: 'kith-coaches-jacket',
    retailer: 'Kith',
    name: 'Kith Coaches Jacket',
    price: 250.0,
    category: 'outerwear',
    sizesAvailable: ['M', 'L', 'XL'],
    tags: ['streetwear'],
  },
  {
    id: 'kith-nb-990',
    retailer: 'Kith',
    name: 'Kith x New Balance 990v6',
    price: 220.0,
    category: 'shoes',
    sizesAvailable: ['9', '9.5', '10', '10.5', '11', '12'],
    tags: ['streetwear'],
  },
  {
    id: 'kith-quilted-cap',
    retailer: 'Kith',
    name: 'Kith Quilted Cap',
    price: 60.0,
    category: 'accessory',
    sizesAvailable: ONE_SIZE,
    tags: ['streetwear'],
  },

  // ---- Buck Mason — workwear and quiet old money ----
  {
    id: 'bm-slub-tee',
    retailer: 'Buck Mason',
    name: 'Slub Curved Hem Tee',
    price: 38.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['minimal', 'workwear'],
  },
  {
    id: 'bm-field-flannel',
    retailer: 'Buck Mason',
    name: 'Field-Spec Flannel',
    price: 118.0,
    category: 'top',
    sizesAvailable: ['M', 'L', 'XL'],
    tags: ['workwear'],
  },
  {
    id: 'bm-waffle-henley',
    retailer: 'Buck Mason',
    name: 'Waffle Knit Henley',
    price: 78.0,
    category: 'top',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['workwear', 'minimal'],
  },
  {
    id: 'bm-ford-denim',
    retailer: 'Buck Mason',
    name: 'Ford Standard Denim',
    price: 148.0,
    category: 'bottom',
    sizesAvailable: ['30x32', '32x30', '32x32', '34x32', '36x32'],
    tags: ['workwear', 'minimal'],
  },
  {
    id: 'bm-chore-jacket',
    retailer: 'Buck Mason',
    name: 'Waxed Canvas Chore Jacket',
    price: 298.0,
    category: 'outerwear',
    sizesAvailable: ['S', 'M', 'L', 'XL'],
    tags: ['workwear', 'old money'],
  },
  {
    id: 'bm-suede-chukka',
    retailer: 'Buck Mason',
    name: 'Suede Chukka Boot',
    price: 228.0,
    category: 'shoes',
    sizesAvailable: ['8', '9', '10', '10.5', '11'],
    tags: ['workwear', 'old money'],
  },
  {
    id: 'bm-leather-belt',
    retailer: 'Buck Mason',
    name: 'Heritage Leather Belt',
    price: 88.0,
    category: 'accessory',
    sizesAvailable: ONE_SIZE,
    tags: ['workwear', 'old money'],
  },
];

export const CATALOG: readonly CatalogItem[] = SEED.map(item => ({
  ...item,
  imageUrl: item.imageUrl ?? placeholder(item.name),
}));
