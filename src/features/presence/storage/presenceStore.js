import { createStore } from "../../../shared/storage/createStore.js";

const store = createStore("presenceStore", { byUserId: {} });

export const presenceStore = {
  get(userId) {
    return store.read().byUserId[userId] || { status: "online", customMessage: "", currentGameId: "" };
  },
  set(userId, patch) {
    store.update(data => {
      data.byUserId[userId] = { ...this.get(userId), ...patch };
    });
  }
};
