
const instructions = {
  chat: "You are Onyx AI, a helpful, honest all-purpose AI assistant.",
  coding: "You are Onyx AI, an expert coding assistant. Explain code clearly.",
  writing: "You are Onyx AI, a helpful writing assistant.",
  research: "You are Onyx AI, a careful research assistant. Be clear about uncertainty."
};

export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: "AI is not configured yet. The hosting API key is missing." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "Please enter a message." }, { status: 400 });
    }

    const mode = instructions[body.mode] ? body.mode : "chat";
    const messages = body.messages
      .filter(m => m && ["user", "assistant"].includes(m.role)
        && typeof m.content === "string")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: instructions[mode],
        input: messages,
        max_output_tokens: 1200
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "AI provider error. Check the API key, model and API billing." },
        { status: 502 }
      );
    }

    const reply = result.output_text;
    if (!reply) {
      return Response.json({ error: "The AI returned no text." }, { status: 502 });
    }

    return Response.json({ reply });
  } catch {
    return Response.json({ error: "The AI request failed. Please try again." }, { status: 500 });
  }
}
