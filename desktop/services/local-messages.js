const { randomUUID } = require("crypto");
const store = require("../store");

const MAX_MESSAGES = 500;

function getMessages(page = 1, limit = 20) {
  const all = store.getMessages();
  const sorted = [...all].reverse();
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const messages = sorted.slice(start, start + limit);

  return {
    messages,
    pagination: { total, page, limit, totalPages },
  };
}

function addMessage({ query, response, transcription, action }) {
  const messages = store.getMessages();
  const msg = {
    id: randomUUID(),
    query: query || transcription || "",
    response: response || "",
    transcription: transcription || "",
    action: action || null,
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  store.setMessages(messages);
  return msg;
}

function clearMessages() {
  store.setMessages([]);
}

module.exports = { getMessages, addMessage, clearMessages };
