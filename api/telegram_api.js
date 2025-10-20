import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const body = req.body || {};
  const chatId = body.message?.chat?.id;
  const userMessage = (body.message?.text || "").trim();

  // Якщо немає повідомлення або chatId — просто завершуємо
  if (!chatId || !userMessage) {
    return res.status(200).send("OK");
  }

  let replyText = "🤖 Thinking...";

  try {
    // Запит до OpenAI (GPT-4o-mini)
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
    replyText =
      data.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from AI.";

  } catch (error) {
    console.error("OpenAI error:", error);
    replyText = "⚠️ Error connecting to OpenAI.";
  }

  try {
    // Надсилаємо відповідь у Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
      }),
    });
  } catch (error) {
    console.error("Telegram error:", error);
  }

  // Відповідаємо Telegram OK (щоб не повторював webhook)
  res.status(200).send("OK");
}