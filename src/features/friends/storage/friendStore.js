import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("friendStore", { friends: [] });

export const friendStore = {
  list: () => store.read().friends,
  add({ nickname, avatarColor = "#8fbf8b", status = "online" }) {
    const friend = { id: uid("friend"), nickname, avatarColor, status, customMessage: "", currentGame: "", createdAt: new Date().toISOString() };
    store.update(data => data.friends.push(friend));
    return friend;
  },
  remove(id) {
    store.update(data => {
      data.friends = data.friends.filter(friend => friend.id !== id);
    });
  },
  update(id, patch) {
    store.update(data => {
      const friend = data.friends.find(item => item.id === id);
      if (friend) Object.assign(friend, patch);
    });
  }
};
