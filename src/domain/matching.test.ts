import { matchCatalog, overlappingTags, sizeFits } from './matching';
import type { Board, CatalogItem, SizingProfile } from './types';

const sizing: SizingProfile = {
  shirtSize: 'M',
  pantWaist: 32,
  pantInseam: 32,
  shoeSize: 10,
};

function makeItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'item-1',
    retailer: 'Uniqlo',
    name: 'Test Item',
    imageUrl: 'https://example.test/item.png',
    price: 49,
    category: 'top',
    sizesAvailable: ['M'],
    tags: ['minimal'],
    ...overrides,
  };
}

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    ownerId: 'user-1',
    title: 'Test Board',
    styleTags: ['minimal'],
    pins: [],
    createdAt: '2026-09-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('matchCatalog', () => {
  it('includes an item that shares a tag and stocks the size', () => {
    const item = makeItem();
    expect(matchCatalog([item], makeBoard(), sizing)).toEqual([item]);
  });

  it('excludes an item that fits but shares no tag', () => {
    const item = makeItem({ tags: ['streetwear'] });
    expect(matchCatalog([item], makeBoard({ styleTags: ['minimal'] }), sizing)).toEqual(
      [],
    );
  });

  it('excludes an item that shares a tag but not the size', () => {
    const item = makeItem({ sizesAvailable: ['XS', 'S'] });
    expect(matchCatalog([item], makeBoard(), sizing)).toEqual([]);
  });

  it('includes an item sharing any one of several board tags', () => {
    const item = makeItem({ tags: ['workwear'] });
    const board = makeBoard({ styleTags: ['minimal', 'workwear', 'preppy'] });
    expect(matchCatalog([item], board, sizing)).toEqual([item]);
  });

  it('returns a matching item once, not once per shared tag', () => {
    const item = makeItem({ tags: ['minimal', 'workwear'] });
    const board = makeBoard({ styleTags: ['minimal', 'workwear'] });
    expect(matchCatalog([item], board, sizing)).toHaveLength(1);
  });

  it('preserves the order of the input catalog', () => {
    const first = makeItem({ id: 'a' });
    const skipped = makeItem({ id: 'b', tags: ['athleisure'] });
    const last = makeItem({ id: 'c' });
    const result = matchCatalog([first, skipped, last], makeBoard(), sizing);
    expect(result.map(i => i.id)).toEqual(['a', 'c']);
  });

  it('returns nothing for a board with no style tags', () => {
    // A board carrying no curation signal must not fall back to the whole
    // catalog — that would defeat the thing being tested.
    const board = makeBoard({ styleTags: [] });
    expect(matchCatalog([makeItem()], board, sizing)).toEqual([]);
  });

  it('returns nothing when the catalog is empty', () => {
    expect(matchCatalog([], makeBoard(), sizing)).toEqual([]);
  });

  it('does not mutate the catalog it is given', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b', tags: ['preppy'] })];
    const snapshot = [...items];
    matchCatalog(items, makeBoard(), sizing);
    expect(items).toEqual(snapshot);
  });
});

describe('sizeFits — category picks the right measurement', () => {
  it('checks a top against shirt size', () => {
    expect(sizeFits(makeItem({ category: 'top', sizesAvailable: ['M'] }), sizing)).toBe(
      true,
    );
    expect(sizeFits(makeItem({ category: 'top', sizesAvailable: ['L'] }), sizing)).toBe(
      false,
    );
  });

  it('checks outerwear against shirt size, not its own scale', () => {
    expect(
      sizeFits(makeItem({ category: 'outerwear', sizesAvailable: ['M'] }), sizing),
    ).toBe(true);
    expect(
      sizeFits(makeItem({ category: 'outerwear', sizesAvailable: ['XL'] }), sizing),
    ).toBe(false);
  });

  it('checks a bottom against waist and inseam together', () => {
    const fits = makeItem({ category: 'bottom', sizesAvailable: ['32x32'] });
    expect(sizeFits(fits, sizing)).toBe(true);
  });

  it('rejects a bottom with the right waist but the wrong inseam', () => {
    // The bug this guards: filtering on waist alone ships 32x30 to someone
    // who wears 32x32, and the trousers arrive visibly short.
    const wrongInseam = makeItem({ category: 'bottom', sizesAvailable: ['32x30'] });
    expect(sizeFits(wrongInseam, sizing)).toBe(false);
  });

  it('rejects a bottom with the right inseam but the wrong waist', () => {
    const wrongWaist = makeItem({ category: 'bottom', sizesAvailable: ['34x32'] });
    expect(sizeFits(wrongWaist, sizing)).toBe(false);
  });

  it('checks shoes against shoe size', () => {
    expect(
      sizeFits(makeItem({ category: 'shoes', sizesAvailable: ['10'] }), sizing),
    ).toBe(true);
    expect(sizeFits(makeItem({ category: 'shoes', sizesAvailable: ['9'] }), sizing)).toBe(
      false,
    );
  });

  it('matches a half shoe size without gaining a trailing zero', () => {
    const half: SizingProfile = { ...sizing, shoeSize: 10.5 };
    expect(sizeFits(makeItem({ category: 'shoes', sizesAvailable: ['10.5'] }), half)).toBe(
      true,
    );
  });

  it('matches a whole shoe size given as a float', () => {
    // String(10.0) is '10', which is what the catalog stocks — not '10.0'.
    const whole: SizingProfile = { ...sizing, shoeSize: 10.0 };
    expect(
      sizeFits(makeItem({ category: 'shoes', sizesAvailable: ['10'] }), whole),
    ).toBe(true);
  });

  it('never size-filters an accessory', () => {
    const unsized = makeItem({ category: 'accessory', sizesAvailable: ['OS'] });
    expect(sizeFits(unsized, sizing)).toBe(true);
    // Even an empty size list, which would fail every other category.
    const empty = makeItem({ category: 'accessory', sizesAvailable: [] });
    expect(sizeFits(empty, sizing)).toBe(true);
  });

  it('does not let one category match on another category measurement', () => {
    // A top stocking only '10' must not pass because the shoe size is 10.
    const topSizedLikeAShoe = makeItem({ category: 'top', sizesAvailable: ['10'] });
    expect(sizeFits(topSizedLikeAShoe, sizing)).toBe(false);

    // A shoe stocking only 'M' must not pass because the shirt size is M.
    const shoeSizedLikeATop = makeItem({ category: 'shoes', sizesAvailable: ['M'] });
    expect(sizeFits(shoeSizedLikeATop, sizing)).toBe(false);
  });

  it('tolerates casing and stray whitespace in seed sizes', () => {
    expect(sizeFits(makeItem({ sizesAvailable: [' m '] }), sizing)).toBe(true);
  });

  it('returns false when an item stocks no sizes at all', () => {
    expect(sizeFits(makeItem({ category: 'top', sizesAvailable: [] }), sizing)).toBe(
      false,
    );
  });
});

describe('overlappingTags', () => {
  it('returns only the tags shared with the board', () => {
    const item = makeItem({ tags: ['minimal', 'streetwear'] });
    const board = makeBoard({ styleTags: ['minimal', 'preppy'] });
    expect(overlappingTags(item, board)).toEqual(['minimal']);
  });

  it('returns every shared tag, in the item order', () => {
    const item = makeItem({ tags: ['workwear', 'minimal'] });
    const board = makeBoard({ styleTags: ['minimal', 'workwear'] });
    expect(overlappingTags(item, board)).toEqual(['workwear', 'minimal']);
  });

  it('returns nothing when there is no overlap', () => {
    const item = makeItem({ tags: ['athleisure'] });
    expect(overlappingTags(item, makeBoard({ styleTags: ['old money'] }))).toEqual([]);
  });

  it('agrees with matchCatalog about what counts as a match', () => {
    // These two must not drift: 4.6 shows the chips from overlappingTags
    // beside items that matchCatalog selected.
    const item = makeItem({ tags: ['preppy'] });
    const board = makeBoard({ styleTags: ['preppy'] });
    expect(overlappingTags(item, board).length > 0).toBe(
      matchCatalog([item], board, sizing).length > 0,
    );
  });
});
