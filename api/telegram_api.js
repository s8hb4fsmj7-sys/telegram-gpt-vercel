import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // 1) Знімаємо оновлення від Telegram
  const body = req.body || {};
  const chatId = body.message?.chat?.id;
  const userMessage = (body.message?.text || "").trim();

  // Telegram інколи шле сервісні апдейти без message/chat
  if (!chatId) return res.status(200).send("OK");

  let replyText = "🤖";

  if (userMessage) {
    // 2) Питаємо OpenAI
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
          temperature: 0.7
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("OpenAI HTTP error:", aiResponse.status, errText);
        replyText = `⚠️ OpenAI error ${aiResponse.status}`;
      } else {
        const data = await aiResponse.json();
        replyText =
          data?.choices?.[0]?.message?.content?.trim() ||
          "⚠️ No reply from AI.";
      }
    } catch (e) {
      console.error("OpenAI fetch failed:", e);
      replyText = "⚠️ Error connecting to OpenAI.";
    }
  } else {
    replyText = "Напиши мені повідомлення 🙂";
  }

  // 3) Відповідаємо у Telegram
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
      }),
    });
  } catch (e) {
    console.error("Telegram send error:", e);
  }

  // 4) Віддаємо 200 одразу, щоб Telegram був щасливий
  return res.status(200).send("OK");
}