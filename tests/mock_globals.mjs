const mockElement = {
    addEventListener: () => {},
    focus: () => {},
    select: () => {},
    value: '',
    appendChild: () => {},
    removeChild: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    setAttribute: () => {},
    removeAttribute: () => {},
    style: {},
    dataset: {},
};

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};
globalThis.document = {
    getElementById: () => mockElement,
    querySelector: () => mockElement,
    querySelectorAll: () => [],
    createElement: () => ({ ...mockElement }),
    body: { ...mockElement },
    addEventListener: () => {}
};
globalThis.window = {
    electronAPI: null,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
};
globalThis.alert = () => {};
globalThis.confirm = () => true;
globalThis.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };

globalThis.Event = class Event { constructor(type) { this.type = type; } };
globalThis.CustomEvent = class CustomEvent extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
globalThis.MutationObserver = class MutationObserver { constructor() {} observe() {} disconnect() {} };
