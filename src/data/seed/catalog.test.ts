/**
 * Invariants on the hardcoded catalog. Not a screen test — these guard the
 * shape of the data the matching rules consume, and a broken one fails
 * silently: a duplicate id makes getById return the wrong garment, and a
 * malformed size makes an item invisible to every recipient.
 */

import { STYLE_TAGS } from '../../domain';
import { CATALOG } from './catalog';

describe('catalog seed', () => {
  it('has unique ids', () => {
    const ids = CATALOG.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses tags from the closed vocabulary', () => {
    const allowed = new Set<string>(STYLE_TAGS);
    const strays = CATALOG.flatMap(item =>
      item.tags.filter(tag => !allowed.has(tag)).map(tag => `${item.id}: ${tag}`),
    );
    expect(strays).toEqual([]);
  });

  it('gives every item at least one tag, or it can never surface', () => {
    expect(CATALOG.filter(item => item.tags.length === 0).map(i => i.id)).toEqual([]);
  });

  it('gives every item at least one size', () => {
    expect(CATALOG.filter(item => item.sizesAvailable.length === 0).map(i => i.id)).toEqual(
      [],
    );
  });

  it('sizes every bottom as waist x inseam', () => {
    const malformed = CATALOG.filter(item => item.category === 'bottom').flatMap(item =>
      item.sizesAvailable.filter(size => !/^\d{2}x\d{2}$/.test(size)).map(size => `${item.id}: ${size}`),
    );
    expect(malformed).toEqual([]);
  });

  it('sizes every shoe as a number the profile can produce', () => {
    // String(shoeSize) never yields a trailing zero, so neither may the seed.
    const malformed = CATALOG.filter(item => item.category === 'shoes').flatMap(item =>
      item.sizesAvailable
        .filter(size => !/^\d{1,2}(\.5)?$/.test(size))
        .map(size => `${item.id}: ${size}`),
    );
    expect(malformed).toEqual([]);
  });

  it('prices every item above zero', () => {
    expect(CATALOG.filter(item => !(item.price > 0)).map(i => i.id)).toEqual([]);
  });

  it('gives every item an image url', () => {
    expect(CATALOG.filter(item => !item.imageUrl).map(i => i.id)).toEqual([]);
  });

  it('requests a raster image, not SVG', () => {
    // placehold.co serves SVG unless the path carries an extension, and React
    // Native's Image silently renders nothing for SVG — every tile came back
    // blank on device with no error. Guarding the extension here because the
    // failure mode gives no other signal.
    const bad = CATALOG.filter(item => !/\.(png|jpe?g|webp)(\?|$)/i.test(item.imageUrl));
    expect(bad.map(i => i.id)).toEqual([]);
  });
});
