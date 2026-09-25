/**
 * Firebase's native modules do not exist under Jest, and importing the real
 * package throws at require time — which would take down the App smoke test
 * even though it never touches Firestore.
 *
 * These mocks exist to let the module graph load. They deliberately do not
 * simulate Firestore: the adapters are verified on a device against the real
 * project, because a hand-written fake would only ever prove that the fake
 * agrees with itself.
 */

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('@react-native-firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  putFile: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));
