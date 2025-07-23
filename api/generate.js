export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const response = await fetch("https://api.suno.ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🧠 Replace below with real key if needed
        Authorization: `Bearer ${process.env.SUNO_API_KEY}`
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Suno API error', details: errorText });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}
