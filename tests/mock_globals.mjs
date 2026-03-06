export const localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    clear() { this._data = {}; }
};

export const document = {
    title: '',
    querySelectorAll: () => [],
};

export const Node = { TEXT_NODE: 3 };

globalThis.localStorage = localStorage;
globalThis.document = document;
globalThis.Node = Node;
