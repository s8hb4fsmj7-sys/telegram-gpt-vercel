import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const body = req.body || {};
  const chatId = body.message?.chat?.id;
  const userMessage = (body.message?.text || "").trim();

  if (!chatId) {
    return res.status(200).send("OK"); // немає кому відповідати
  }

  let replyText = "🤖";

  if (userMessage) {
    // 1) спроба через OpenAI
    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: userMessage }],
          temperature: 0.7,
        }),
      });

      const data = await aiResponse.json();
      replyText = data.choices?.[0]?.message?.content?.trim()
        || "⚠️ No reply from AI.";
    } catch (e) {
      console.error("OpenAI error:", e);
      // 2) фолбек — хоча б ехо, щоб бот не мовчав
      replyText = `Echo: ${userMessage}`;
    }
  }

  // Відправка відповіді в Telegram
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: replyText }),
    });
  } catch (e) {
    console.error("Telegram sendMessage error:", e);
  }

  return res.status(200).send("OK");
}
