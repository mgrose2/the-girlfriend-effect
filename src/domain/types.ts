/**
 * The core data model, per the prototype plan §4.
 *
 * Role names are deliberately generic (`stylist` / `recipient`) rather than
 * gendered — costs nothing now, and keeps the door open if the product
 * broadens past its original framing.
 */

export type Role = 'stylist' | 'recipient';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Only present for 'recipient', and only after they complete intake. */
  sizing?: SizingProfile;
}

export interface SizingProfile {
  shirtSize: string;
  pantWaist: number;
  pantInseam: number;
  shoeSize: number;
  preferredFit?: string;
}

export interface Pin {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  note?: string;
  tags: string[];
}

export interface Board {
  id: string;
  /** Stylist's user id. */
  ownerId: string;
  /** Set once the board is sent and claimed. */
  recipientId?: string;
  title: string;
  styleTags: StyleTag[];
  pins: Pin[];
  createdAt: string;
  sentAt?: string;
  /**
   * Human-typable code (`TGE-4F9K`) generated when the board is shared.
   * Not in plan §4 — added here because 3.4/3.5 need somewhere to put it and
   * changing the type mid-sprint is worse than declaring it now.
   */
  shareCode?: string;
}

export type Retailer =
  | 'H&M'
  | 'Uniqlo'
  | 'Abercrombie'
  | 'J.Crew'
  | 'Lululemon'
  | 'Kith'
  | 'Buck Mason';

export type Category = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory';

export interface CatalogItem {
  id: string;
  retailer: Retailer;
  name: string;
  imageUrl: string;
  price: number;
  category: Category;
  /**
   * Format depends on `category`, and `matching.ts` relies on it:
   * tops/outerwear `'M'`, bottoms `'32x32'` (waist x inseam),
   * shoes `'10.5'`, accessories `'OS'`.
   */
  sizesAvailable: string[];
  /** Matched against `Board.styleTags`. */
  tags: StyleTag[];
}

export interface Order {
  id: string;
  boardId: string;
  recipientId: string;
  items: CatalogItem[];
  total: number;
  /** No real fulfilment states — checkout writes a record and stops. */
  status: 'placed';
  createdAt: string;
}

/**
 * The fixed style vocabulary. Closed on purpose: matching is tag overlap, and
 * free-text tags would mean a stylist and the catalog never agree on a spelling.
 */
export const STYLE_TAGS = [
  'old money',
  'streetwear',
  'athleisure',
  'minimal',
  'workwear',
  'preppy',
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number];
