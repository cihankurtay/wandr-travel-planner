module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured. Add ANTHROPIC_API_KEY in Vercel Settings > Environment Variables." });
  }

  try {
    const { destination, days, style } = req.body || {};

    if (!destination || !days || !style) {
      return res.status(400).json({ error: "Missing required fields: destination, days, style" });
    }

    const prompt = `You are an expert travel guide. Create a detailed ${days}-day ${style} travel itinerary for ${destination}.

Format each day exactly like this:
DAY 1: [Title]
[Detailed morning, afternoon, and evening activities. Include specific venues, local food recommendations, and practical tips. 3-4 paragraphs.]

DAY 2: [Title]
...

Write in English. Make each day vivid, specific, and practical. Skip any intro or closing remarks — go straight to the days.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Anthropic API error",
        details: data.error?.type || "unknown"
      });
    }

    const text = data.content.map(b => b.text || "").join("");
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: "Server error: " + error.message });
  }
};
