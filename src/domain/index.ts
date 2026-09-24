// Pure types and logic. No React, no I/O, no imports from outside `domain/`.
// Everything here is unit-testable without a renderer or a device.
export { newId } from './ids';
export { matchCatalog, overlappingTags, sizeFits } from './matching';
export { STYLE_TAGS } from './types';
export type {
  Board,
  CatalogItem,
  Category,
  Order,
  Pin,
  Retailer,
  Role,
  SizingProfile,
  StyleTag,
  User,
} from './types';
