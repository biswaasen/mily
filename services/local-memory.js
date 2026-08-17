const { randomUUID } = require("crypto");
const store = require("../store");

function getMemories() {
  return store.getMemories();
}

function addMemory(content) {
  if (!content?.trim()) return null;
  const memories = store.getMemories();
  const memory = {
    id: randomUUID(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  memories.push(memory);
  store.setMemories(memories);
  return memory;
}

function deleteMemory(id) {
  const memories = store.getMemories();
  const filtered = memories.filter((m) => m.id !== id);
  store.setMemories(filtered);
  return filtered.length !== memories.length;
}

module.exports = { getMemories, addMemory, deleteMemory };
