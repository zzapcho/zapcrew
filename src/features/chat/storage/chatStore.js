import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("chatStore", { conversations: [] });

export const chatStore = {
  list: () => store.read().conversations,
  create({ type = "dm", name, participantIds = [], participantNames = [] }) {
    const conversation = { id: uid("chat"), type, name, participantIds, participantNames, messages: [], createdAt: new Date().toISOString() };
    store.update(data => data.conversations.push(conversation));
    return conversation;
  },
  send(conversationId, { authorId, authorName, text, attachmentName = "" }) {
    const message = { id: uid("msg"), authorId, authorName, text, attachmentName, reactions: {}, createdAt: new Date().toISOString() };
    store.update(data => {
      const conversation = data.conversations.find(item => item.id === conversationId);
      if (conversation) conversation.messages.push(message);
    });
    return message;
  },
  deleteMessage(conversationId, messageId) {
    store.update(data => {
      const conversation = data.conversations.find(item => item.id === conversationId);
      if (conversation) conversation.messages = conversation.messages.filter(message => message.id !== messageId);
    });
  },
  react(conversationId, messageId, emoji) {
    store.update(data => {
      const message = data.conversations.find(item => item.id === conversationId)?.messages.find(item => item.id === messageId);
      if (message) message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
    });
  }
};
