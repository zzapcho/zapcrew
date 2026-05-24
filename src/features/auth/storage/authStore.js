import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("authStore", { accounts: [], currentUserId: null });

export const authStore = {
  all: () => store.read(),
  current() {
    const data = store.read();
    return data.accounts.find(account => account.id === data.currentUserId) || null;
  },
  createAccount({ nickname, avatarColor }) {
    const account = { id: uid("user"), nickname, avatarColor, createdAt: new Date().toISOString() };
    store.update(data => {
      data.accounts.push(account);
      data.currentUserId = account.id;
    });
    return account;
  },
  login(nickname) {
    const data = store.read();
    const account = data.accounts.find(item => item.nickname.toLowerCase() === nickname.toLowerCase());
    if (!account) return null;
    data.currentUserId = account.id;
    store.write(data);
    return account;
  },
  logout() {
    store.update(data => {
      data.currentUserId = null;
    });
  },
  updateProfile(patch) {
    let updated = null;
    store.update(data => {
      const account = data.accounts.find(item => item.id === data.currentUserId);
      if (account) {
        Object.assign(account, patch);
        updated = account;
      }
    });
    return updated;
  }
};
