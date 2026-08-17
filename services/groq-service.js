const store = require("../store");
const FormData = require("form-data");
const localLinks = require("./local-links");

let _fetch = null;
async function getFetch() {
  if (!_fetch) _fetch = (await import("node-fetch")).default;
  return _fetch;
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function transcribeAudio(audioBuffer, apiKey) {
  const fetch = await getFetch();
  const cfg = store.getProviderConfig();
  const sttModel = store.getSttModel();

  const form = new FormData();
  form.append("file", audioBuffer, {
    filename: "audio.webm",
    contentType: "audio/webm",
  });
  form.append("model", sttModel);
  form.append("response_format", "json");

  const response = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}

async function chatCompletion(transcription, context, apiKey) {
  const fetch = await getFetch();
  const cfg = store.getProviderConfig();
  const chatModel = store.getChatModel();

  const systemPrompt = store.getSystemPrompt();
  const memories = store.getMemories();
  const links = store.getLinks();
  const userName = store.getUserName();

  let systemContent = systemPrompt;

  if (userName) {
    systemContent = `The user's name is ${userName}.\n\n` + systemContent;
  }

  if (links.length > 0) {
    const linkLines = links.map((l) => `- ${l.name}: ${l.url}`).join("\n");
    systemContent += `\n\nSaved links (use these names for open_link):\n${linkLines}`;
  } else {
    systemContent += `\n\nSaved links: (none)`;
  }

  if (memories.length > 0) {
    const memoryLines = memories.map((m) => `- ${m.content}`).join("\n");
    systemContent += `\n\nUser words (spellings, names, Hindi/English terms):\n${memoryLines}`;
  }

  const userContent = context
    ? `[Current app: ${context}]\nUser said: "${transcription}"`
    : `User said: "${transcription}"`;

  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Chat failed: ${response.status}`);
  }

  const data = await response.json();
  const raw = (data.choices?.[0]?.message?.content || "").trim();
  const parsed = extractJson(raw);

  if (!parsed || typeof parsed !== "object") {
    return { response: raw.replace(/^["']|["']$/g, ""), action: null };
  }

  const intent = (parsed.intent || "transcript").toLowerCase();

  if (intent === "open_link") {
    const match = localLinks.findLinkByName(parsed.link || parsed.name || "");
    if (match) {
      return {
        response: "",
        action: { action: "open_url", url: match.url, linkName: match.name },
      };
    }
    return {
      response: (parsed.text || transcription || "").trim(),
      action: null,
    };
  }

  if (intent === "open_app" && parsed.app) {
    return {
      response: "",
      action: { action: "open_app", app: String(parsed.app).trim() },
    };
  }

  return {
    response: (parsed.text || transcription || "").trim(),
    action: null,
  };
}

async function processAudio(audioBuffer, context) {
  const apiKey = store.getGroqApiKey();
  if (!apiKey) throw new Error("API key not set. Add it in Provider settings.");

  console.log("[AI] Transcribing audio...", audioBuffer.length, "bytes");
  const transcription = await transcribeAudio(audioBuffer, apiKey);
  console.log("[AI] Transcription:", transcription);

  if (!transcription.trim()) {
    return { transcription: "", response: "", action: null };
  }

  console.log("[AI] Resolving intent...");
  const parsed = await chatCompletion(transcription, context, apiKey);
  console.log("[AI] Response:", parsed.response, "Action:", parsed.action);

  return {
    transcription,
    response: parsed.response || "",
    action: parsed.action || null,
  };
}

async function verifyApiKey(apiKey) {
  const fetch = await getFetch();
  const cfg = store.getProviderConfig();
  const response = await fetch(`${cfg.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return response.ok;
}

module.exports = { processAudio, verifyApiKey };
