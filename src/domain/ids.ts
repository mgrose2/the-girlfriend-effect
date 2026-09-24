/**
 * Id generation. Not pure in the strict sense — it reads the clock and a
 * random source — but it has no I/O and no React, and every entity in the app
 * needs it, so this is its least surprising home.
 *
 * No uuid dependency: the collision surface here is a handful of records on
 * one device, and Firestore document ids take over for anything shared.
 */
export function newId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}${random}`;
}
