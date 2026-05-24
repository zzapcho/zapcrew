import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("crewStore", { crews: [] });

export const crewStore = {
  list: () => store.read().crews,
  create({ name, ownerId, ownerName }) {
    const crew = {
      id: uid("crew"),
      name,
      members: [{ userId: ownerId, nickname: ownerName, role: "Owner" }],
      channels: [
        { id: uid("channel"), name: "공지", type: "notice", messages: [] },
        { id: uid("channel"), name: "일반", type: "text", messages: [] },
        { id: uid("channel"), name: "게임모집", type: "party", messages: [] }
      ],
      createdAt: new Date().toISOString()
    };
    store.update(data => data.crews.push(crew));
    return crew;
  },
  addChannel(crewId, { name, type = "text" }) {
    const channel = { id: uid("channel"), name, type, messages: [] };
    store.update(data => data.crews.find(crew => crew.id === crewId)?.channels.push(channel));
    return channel;
  },
  send(crewId, channelId, { authorId, authorName, text }) {
    const message = { id: uid("cmsg"), authorId, authorName, text, createdAt: new Date().toISOString() };
    store.update(data => {
      const channel = data.crews.find(crew => crew.id === crewId)?.channels.find(item => item.id === channelId);
      if (channel) channel.messages.push(message);
    });
    return message;
  }
};
