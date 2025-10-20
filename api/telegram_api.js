import fetch from "node-fetch";

export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  if (req.method === "POST") {
    const message = req.body?.message?.text || "";
    const chatId = req.body?.message?.chat?.id;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply }),
    });

    res.status(200).send("OK");
  } else {
    res.status(405).send("Method not allowed");
  }
}
