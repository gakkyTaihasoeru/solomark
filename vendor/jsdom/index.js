// Lightweight local stub of the jsdom API so Vitest can run without the npm registry.
class SimpleEventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, listener) {
    const existing = this._listeners.get(type) ?? new Set();
    existing.add(listener);
    this._listeners.set(type, existing);
  }

  removeEventListener(type, listener) {
    const existing = this._listeners.get(type);
    if (!existing) {
      return;
    }
    existing.delete(listener);
    if (existing.size === 0) {
      this._listeners.delete(type);
    }
  }

  dispatchEvent(event) {
    const existing = this._listeners.get(event.type);
    if (!existing) {
      return true;
    }
    for (const listener of existing) {
      listener.call(this, event);
    }
    return !event.defaultPrevented;
  }
}

class SimpleDocument extends SimpleEventTarget {
  constructor(window) {
    super();
    this.defaultView = window;
    this.documentElement = { ownerDocument: this };
    this.body = { ownerDocument: this, style: {}, appendChild: () => {} };
  }

  createElement(tagName) {
    return {
      tagName: tagName.toUpperCase(),
      style: {},
      children: [],
      ownerDocument: this,
      appendChild(child) {
        this.children.push(child);
        return child;
      },
    };
  }

  createTextNode(text) {
    return { nodeType: 3, textContent: text, ownerDocument: this };
  }
}

class SimpleWindow extends SimpleEventTarget {
  constructor() {
    super();
    this.document = new SimpleDocument(this);
    this.navigator = { userAgent: "node.js", language: "en-US" };
    this.location = new URL("http://localhost");
    this.console = console;
    this.self = this;
    this.globalThis = this;
    this.HTMLElement = class {};
    this.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
        this.bubbles = Boolean(init.bubbles);
        this.cancelable = Boolean(init.cancelable);
        this.defaultPrevented = false;
      }

      preventDefault() {
        this.defaultPrevented = true;
      }
    };
  }

  setTimeout(handler, timeout = 0, ...args) {
    return setTimeout(handler, timeout, ...args);
  }

  clearTimeout(id) {
    clearTimeout(id);
  }

  requestAnimationFrame(callback) {
    return this.setTimeout(() => callback(Date.now()), 16);
  }

  cancelAnimationFrame(id) {
    this.clearTimeout(id);
  }
}

class JSDOM {
  constructor(html = "", options = {}) {
    this.window = new SimpleWindow();
    this.serialize = () => html;
  }
}

module.exports = { JSDOM };
