import fetch from "node-fetch";

export default async function handler(req, res) {
  // 1) Вебхук приймає тільки POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // 2) Дістаємо повідомлення
  const body = req.body || {};
  const chatId = body.message?.chat?.id;
  const userMessage = (body.message?.text || "").trim();

  // Telegram вимагає 200 дуже швидко — віддаємо ОК одразу.
  res.status(200).send("OK");

  // Якщо нема чату/тексту — більше нічого не робимо
  if (!chatId || !userMessage) return;

  // 3) Підготуємо ключі
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // 4) Функція відправки в Telegram
  const sendToTelegram = async (text) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (e) {
      console.error("Telegram send error:", e);
    }
  };

  // 5) Якщо нема ключа OpenAI — хоча б не мовчимо
  if (!OPENAI_API_KEY) {
    await sendToTelegram("⚠️ Немає OPENAI_API_KEY на сервері.");
    return;
  }

  // 6) Виклик OpenAI
  let replyText = "🤖";
  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.7,
      }),
    });

    const data = await aiResponse.json();
    replyText =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No reply from AI.";
  } catch (e) {
    console.error("OpenAI error:", e);
    replyText = "⚠️ Помилка звернення до OpenAI.";
  }

  // 7) Відсилаємо відповідь у Telegram
  await sendToTelegram(replyText);
}
