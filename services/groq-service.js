const store = require("../store");
const localLinks = require("./local-links");

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
  const cfg = store.getProviderConfig();
  const sttModel = store.getSttModel();

  const form = new FormData();
  form.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "audio.webm");
  form.append("model", sttModel);
  form.append("response_format", "json");
  const language = store.getSttLanguage();
  if (language !== "auto") form.append("language", language);
  // Keep vocabulary hints concise; the speech API has a limited prompt window.
  const words = store.getMemories().map(word => word.content).filter(Boolean).join(", ").slice(0, 500);
  if (words) form.append("prompt", words);

  const response = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  systemContent += "\n\nPreserve the speaker's language and normal sentence capitalization. Use the exact saved spellings for matching names. Return one JSON object with string fields intent, text, link, and app. Never return prose outside the JSON. Websites are not installed macOS apps; use a saved link for a website, or transcribe if no link matches. Opening a link does not play videos or perform browser actions.";

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
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (err.error?.code === "json_validate_failed" || /failed to generate json/i.test(err.error?.message || "")) {
      return { response: transcription, action: null };
    }
    throw new Error(err.error?.message || `Chat failed: ${response.status}`);
  }

  const data = await response.json();
  const raw = (data.choices?.[0]?.message?.content || "").trim();
  const parsed = extractJson(raw);
  const fallback = { response: transcription, action: null };
  if (data.choices?.[0]?.finish_reason === "length") return fallback;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;

  if (typeof parsed.intent !== "string") return fallback;
  const intent = parsed.intent.toLowerCase();
  if (!["transcript", "open_link", "open_app"].includes(intent)) return fallback;
  if (typeof parsed.text !== "string") return fallback;

  if (intent === "open_link") {
    const name = parsed.link || parsed.name;
    if (typeof name !== "string") return fallback;
    const match = localLinks.findLinkByName(name);
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

  if (intent === "open_app" && typeof parsed.app === "string" && parsed.app.trim()) {
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

  if (!transcription.trim()) {
    return { transcription: "", response: "", action: null };
  }

  console.log("[AI] Resolving intent...");
  const parsed = await chatCompletion(transcription, context, apiKey);

  return {
    transcription,
    response: parsed.response || "",
    action: parsed.action || null,
  };
}

async function verifyApiKey(apiKey) {
  const cfg = store.getProviderConfig();
  const response = await fetch(`${cfg.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return response.ok;
}

module.exports = { processAudio, verifyApiKey };
