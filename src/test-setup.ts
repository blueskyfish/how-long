import 'fake-indexeddb/auto';

// jsdom does not implement structuredClone, which Dexie relies on internally.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
}
