import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt missing" });

  const REPLICATE_API_TOKEN = "r8_MnRDTV9y0roZ7L4euIeFubMS4b0LZmO0d2Zb8"; // 🔑 Your Replicate API key
  const VERCEL_TOKEN = "oDHQdx07ukpm9aHa0mWlot6g";                     // 🔑 Your Vercel token
  const TEAM_ID = "team_0FwPUYaMD3zrpCwq7U64Os42";                     // 🧢 Your team id from earlier

  // 1. Use Replicate to generate HTML code
  const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "b89f7589393704fd63efeb9fa1f4a8c899b946ce802fd3c385384dfa7a5b2f1d",
      input: {
        prompt: `Generate a clean, responsive website using HTML+CSS. User said: "${prompt}". Return everything inside a <html> document.`,
      },
    }),
  });

  const replicateData = await replicateRes.json();
  const predictionUrl = replicateData?.urls?.get;
  if (!predictionUrl) return res.status(500).json({ error: "Failed to start AI generation" });

  // 2. Poll for result
  let output = null;
  for (let i = 0; i < 10; i++) {
    const poll = await fetch(predictionUrl, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    const data = await poll.json();
    if (data?.status === "succeeded") {
      output = data.output;
      break;
    }
    await new Promise((r) => setTimeout(r, 2500)); // wait before retry
  }

  if (!output || !output.includes("<html")) return res.status(500).json({ error: "Invalid AI output" });

  // 3. Deploy to Vercel
  const siteId = uuidv4();
  const deployRes = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `webcraft-${siteId}`,
      files: [
        {
          file: "index.html",
          data: Buffer.from(output).toString("base64"),
          encoding: "base64",
        },
      ],
      projectSettings: { framework: null },
      target: "production",
    }),
  });

  const deployData = await deployRes.json();
  const finalUrl = deployData?.url ? `https://${deployData.url}` : null;

  if (!finalUrl) return res.status(500).json({ error: "Failed to deploy website" });

  // 4. Done
  res.status(200).json({ url: finalUrl });
                                   }
