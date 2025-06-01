const express = require("express");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ Rudra Media API is live. Use /audio?q=songname");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send("❌ Provide song with ?q=songname");

  try {
    const result = await ytSearch(query);
    const video = result.videos[0];
    if (!video) return res.status(404).send("❌ No video found");

    const stream = ytdl(video.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25, // Buffer to prevent crashing
    });

    res.setHeader("Content-Disposition", `attachment; filename="${video.title}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");

    stream.pipe(res).on("error", (err) => {
      console.error("Stream Pipe Error:", err);
      res.status(500).send("⚠️ Stream failed.");
    });

  } catch (err) {
    console.error("Audio Fetch Error:", err);
    res.status(500).send("💥 Internal error while processing audio.");
  }
});

app.listen(PORT, () => {
  console.log(`🎧 RudraMediaAPI running on port ${PORT}`);
});
