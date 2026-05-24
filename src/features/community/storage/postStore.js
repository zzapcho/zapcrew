import { createStore, uid } from "../../../shared/storage/createStore.js";

const store = createStore("postStore", { posts: [] });

export const postStore = {
  list: () => store.read().posts,
  add({ board = "자유", title, body, authorName, pollOptions = [] }) {
    const post = {
      id: uid("post"),
      board,
      title,
      body,
      authorName,
      likes: 0,
      reactions: {},
      comments: [],
      poll: pollOptions.filter(Boolean).length ? pollOptions.filter(Boolean).map(text => ({ text, votes: 0 })) : null,
      createdAt: new Date().toISOString()
    };
    store.update(data => data.posts.unshift(post));
    return post;
  },
  like(id) {
    store.update(data => {
      const post = data.posts.find(item => item.id === id);
      if (post) post.likes += 1;
    });
  },
  react(id, emoji) {
    store.update(data => {
      const post = data.posts.find(item => item.id === id);
      if (post) post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    });
  },
  comment(id, { authorName, body }) {
    store.update(data => {
      const post = data.posts.find(item => item.id === id);
      if (post) post.comments.push({ id: uid("comment"), authorName, body, createdAt: new Date().toISOString() });
    });
  },
  vote(id, optionIndex) {
    store.update(data => {
      const option = data.posts.find(item => item.id === id)?.poll?.[optionIndex];
      if (option) option.votes += 1;
    });
  },
  remove(id) {
    store.update(data => {
      data.posts = data.posts.filter(post => post.id !== id);
    });
  }
};
