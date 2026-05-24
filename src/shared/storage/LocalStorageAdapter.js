export class LocalStorageAdapter {
  constructor(prefix = "zapcrew") {
    this.prefix = prefix;
  }

  key(name) {
    return `${this.prefix}:${name}`;
  }

  get(name, fallback) {
    const raw = localStorage.getItem(this.key(name));
    if (!raw) return structuredClone(fallback);
    try {
      return JSON.parse(raw);
    } catch {
      return structuredClone(fallback);
    }
  }

  set(name, value) {
    localStorage.setItem(this.key(name), JSON.stringify(value));
    return value;
  }

  remove(name) {
    localStorage.removeItem(this.key(name));
  }

  exportAll() {
    const data = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(`${this.prefix}:`)) continue;
      data[key.replace(`${this.prefix}:`, "")] = JSON.parse(localStorage.getItem(key));
    }
    return data;
  }

  importAll(data) {
    Object.entries(data || {}).forEach(([key, value]) => this.set(key, value));
  }

  clearAll() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.prefix}:`))
      .forEach(key => localStorage.removeItem(key));
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
