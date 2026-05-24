import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("eventStore", { events: [] });

export const eventStore = {
  list: () => store.read().events,
  add({ title, startsAt, scope = "personal", crewName = "" }) {
    const event = { id: uid("event"), title, startsAt, scope, crewName, response: "미정", createdAt: new Date().toISOString() };
    store.update(data => data.events.push(event));
    return event;
  },
  respond(id, response) {
    store.update(data => {
      const event = data.events.find(item => item.id === id);
      if (event) event.response = response;
    });
  },
  remove(id) {
    store.update(data => {
      data.events = data.events.filter(event => event.id !== id);
    });
  }
};
