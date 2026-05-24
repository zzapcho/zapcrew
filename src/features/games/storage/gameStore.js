import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("gameStore", { games: [] });

export const gameStore = {
  list: () => store.read().games,
  add({ name, icon = "▶", launchUrl = "", steamUrl = "" }) {
    const game = { id: uid("game"), name, icon, launchUrl, steamUrl, pinned: false, lastLaunchedAt: "", createdAt: new Date().toISOString() };
    store.update(data => data.games.push(game));
    return game;
  },
  togglePin(id) {
    store.update(data => {
      const game = data.games.find(item => item.id === id);
      if (game) game.pinned = !game.pinned;
    });
  },
  markLaunched(id) {
    store.update(data => {
      const game = data.games.find(item => item.id === id);
      if (game) game.lastLaunchedAt = new Date().toISOString();
    });
  },
  remove(id) {
    store.update(data => {
      data.games = data.games.filter(game => game.id !== id);
    });
  }
};
