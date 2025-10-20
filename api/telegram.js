import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  const body = req.body || {};
  const chatId = body.message?.chat?.id;
  const text = (body.message?.text || "").trim();

  if (!chatId) {
    // немає коректного повідомлення — віддаємо OK
    return res.status(200).send("OK");
  }

  let reply = "🤖";

  if (text) {
    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: text }],
          temperature: 0.7,
        }),
      });

      const data = await aiResponse.json();
      reply = data.choices?.[0]?.message?.content?.trim() || "⚠️ No response from AI.";
    } catch (e) {
      console.error("OpenAI error:", e);
      reply = "⚠️ Error connecting to OpenAI.";
    }
  }

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply }),
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }

  return res.status(200).send("OK");
}
