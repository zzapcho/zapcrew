import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("notificationStore", { notifications: [] });

export const notificationStore = {
  list: () => store.read().notifications,
  add(text) {
    const item = { id: uid("notice"), text, read: false, createdAt: new Date().toISOString() };
    store.update(data => data.notifications.unshift(item));
    return item;
  },
  readAll() {
    store.update(data => data.notifications.forEach(item => {
      item.read = true;
    }));
  }
};
