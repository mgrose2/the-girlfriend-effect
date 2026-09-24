/**
 * Catalog matching — tag overlap plus a category-correct size check. This is
 * the entire recommendation algorithm and it is meant to be: see CLAUDE.md on
 * why there is no ML here.
 *
 * Pure and dependency-free, so it is unit-tested directly rather than through
 * a screen.
 */

import type { Board, CatalogItem, Category, SizingProfile } from './types';

/**
 * Items a recipient should see for a board: the item's style overlaps what the
 * stylist picked, and it comes in a size that fits them.
 *
 * Order is preserved from `items`, so the seed catalog's retailer grouping
 * survives into the shop grid.
 */
export function matchCatalog(
  items: readonly CatalogItem[],
  board: Board,
  sizing: SizingProfile,
): CatalogItem[] {
  // A board with no style tags carries no curation signal. Returning the whole
  // catalog would quietly turn "picked for you" into "here is everything",
  // which is the one thing this prototype is trying to test.
  if (board.styleTags.length === 0) {
    return [];
  }

  return items.filter(
    item => overlappingTags(item, board).length > 0 && sizeFits(item, sizing),
  );
}

/**
 * Why an item was picked — the tags it shares with the board. Drives the
 * curation-context chips in 4.6, and is the same comparison `matchCatalog`
 * filters on, so the two cannot drift apart.
 */
export function overlappingTags(item: CatalogItem, board: Board): string[] {
  const boardTags = new Set(board.styleTags);
  return item.tags.filter(tag => boardTags.has(tag));
}

/**
 * Whether an item comes in the recipient's size, checked against whichever
 * measurement actually applies to the category.
 */
export function sizeFits(item: CatalogItem, sizing: SizingProfile): boolean {
  const required = requiredSize(item.category, sizing);
  // Accessories are one-size — nothing to check.
  if (required === null) {
    return true;
  }
  return item.sizesAvailable.some(size => normalize(size) === normalize(required));
}

/**
 * The size string an item must stock, per plan §4:
 * top and outerwear use shirt size, bottom uses waist x inseam, shoes use shoe
 * size, and accessories are unsized.
 */
function requiredSize(category: Category, sizing: SizingProfile): string | null {
  switch (category) {
    case 'top':
    case 'outerwear':
      return sizing.shirtSize;
    case 'bottom':
      return `${sizing.pantWaist}x${sizing.pantInseam}`;
    case 'shoes':
      // Number -> string drops a trailing zero, so 10.0 becomes '10' and
      // matches the catalog's '10' rather than looking for '10.0'.
      return String(sizing.shoeSize);
    case 'accessory':
      return null;
  }
}

/** Cheap insurance against ' M ' or 'm' in hand-authored seed data. */
function normalize(size: string): string {
  return size.trim().toLowerCase();
}
