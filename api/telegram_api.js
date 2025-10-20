import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    // Якщо є повідомлення
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const userMessage = body.message.text;

      try {
        // Запит до OpenAI
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }],
          }),
        });

        const data = await aiResponse.json();
        const replyText = data.choices?.[0]?.message?.content || "Вибач, я не зміг відповісти.";

        // Відправляємо відповідь користувачу
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
          }),
        });
      } catch (error) {
        console.error("Error:", error);
      }
    }

    res.status(200).send("ok");
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
