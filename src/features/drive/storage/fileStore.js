import { createStore, uid } from "../../../shared/storage/createStore.js";
import { indexedDBAdapter } from "../../../shared/storage/IndexedDBAdapter.js";

const store = createStore("fileStore", { folders: [{ id: "root", name: "기본" }], files: [] });

export const fileStore = {
  list: () => store.read(),
  createFolder(name) {
    const folder = { id: uid("folder"), name, createdAt: new Date().toISOString() };
    store.update(data => data.folders.push(folder));
    return folder;
  },
  async addFiles(files, folderId = "root") {
    const added = [];
    for (const file of files) {
      const id = uid("file");
      await indexedDBAdapter.put(id, file);
      added.push({ id, folderId, name: file.name, size: file.size, type: file.type || "application/octet-stream", uploadedAt: new Date().toISOString() });
    }
    store.update(data => data.files.push(...added));
    return added;
  },
  async download(id) {
    return indexedDBAdapter.get(id);
  },
  async remove(id) {
    await indexedDBAdapter.delete(id);
    store.update(data => {
      data.files = data.files.filter(file => file.id !== id);
    });
  }
};
