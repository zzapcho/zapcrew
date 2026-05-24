import { localStorageAdapter } from "./LocalStorageAdapter.js";

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStore(name, fallback) {
  return {
    read() {
      return localStorageAdapter.get(name, fallback);
    },
    write(value) {
      return localStorageAdapter.set(name, value);
    },
    update(mutator) {
      const next = this.read();
      mutator(next);
      this.write(next);
      return next;
    }
  };
}
