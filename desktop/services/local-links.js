const { randomUUID } = require("crypto");
const store = require("../store");

function getLinks() {
  return store.getLinks();
}

function addLink(name, url) {
  const n = (name || "").trim();
  const u = (url || "").trim();
  if (!n || !u) return null;

  let normalized = u;
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  const links = store.getLinks();
  const existing = links.find((l) => l.name.toLowerCase() === n.toLowerCase());
  if (existing) {
    existing.url = normalized;
    existing.name = n;
    store.setLinks(links);
    return existing;
  }

  const link = {
    id: randomUUID(),
    name: n,
    url: normalized,
    createdAt: new Date().toISOString(),
  };
  links.push(link);
  store.setLinks(links);
  return link;
}

function deleteLink(id) {
  const links = store.getLinks();
  const filtered = links.filter((l) => l.id !== id);
  store.setLinks(filtered);
  return filtered.length !== links.length;
}

function findLinkByName(name) {
  if (!name) return null;
  const q = name.trim().toLowerCase();
  const links = store.getLinks();
  return (
    links.find((l) => l.name.toLowerCase() === q) ||
    links.find((l) => q.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(q)) ||
    null
  );
}

module.exports = { getLinks, addLink, deleteLink, findLinkByName };
