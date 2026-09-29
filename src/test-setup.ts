import 'fake-indexeddb/auto';

// jsdom does not implement structuredClone, which Dexie relies on internally.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
}

// jsdom does no layout, so it has neither of these; the select's list needs both to open.
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => undefined;
}
