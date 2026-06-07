const store = require("../store");
const FormData = require("form-data");

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const CHAT_MODEL = "llama-3.3-70b-versatile";
const STT_MODEL = "whisper-large-v3-turbo";

let _fetch = null;
async function getFetch() {
  if (!_fetch) _fetch = (await import("node-fetch")).default;
  return _fetch;
}

async function transcribeAudio(audioBuffer, apiKey) {
  const fetch = await getFetch();

  const form = new FormData();
  form.append("file", audioBuffer, {
    filename: "audio.webm",
    contentType: "audio/webm",
  });
  form.append("model", STT_MODEL);
  form.append("response_format", "json");

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
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

  const systemPrompt = store.getSystemPrompt();
  const memories = store.getMemories();
  const userName = store.getUserName();

  let systemContent = systemPrompt;

  if (userName) {
    systemContent = `The user's name is ${userName}.\n\n` + systemContent;
  }

  if (memories.length > 0) {
    const memoryLines = memories.map((m) => `- ${m.content}`).join("\n");
    systemContent += `\n\nUser memories (context about the user):\n${memoryLines}`;
  }

  const userContent = context
    ? `[Current app: ${context}]\nUser said: "${transcription}"`
    : `User said: "${transcription}"`;

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Chat failed: ${response.status}`);
  }

  const data = await response.json();
  const cleaned = (data.choices?.[0]?.message?.content || "").trim();
  return { response: cleaned, action: null };
}

async function processAudio(audioBuffer, context) {
  const apiKey = store.getGroqApiKey();
  if (!apiKey) throw new Error("Groq API key not set. Please add it in Settings.");

  console.log("[Groq] Transcribing audio...", audioBuffer.length, "bytes");
  const transcription = await transcribeAudio(audioBuffer, apiKey);
  console.log("[Groq] Transcription:", transcription);

  if (!transcription.trim()) {
    return { transcription: "", response: "", action: null };
  }

  console.log("[Groq] Getting chat completion...");
  const parsed = await chatCompletion(transcription, context, apiKey);
  console.log("[Groq] Response:", parsed.response);

  return {
    transcription,
    response: parsed.response || "",
    action: parsed.action || null,
  };
}

async function verifyApiKey(apiKey) {
  const fetch = await getFetch();
  const response = await fetch(`${GROQ_API_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return response.ok;
}

module.exports = { processAudio, verifyApiKey };
