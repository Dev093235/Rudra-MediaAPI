const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Rudra Media API is running ✅");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;

  if (!query) return res.status(400).json({ error: "Missing 'q' query" });

  try {
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get("Type").get("Video");

    const searchResults = await ytsr(videoFilter.url, { limit: 1 });
    const video = searchResults.items[0];

    if (!video || !video.url) {
      return res.status(404).json({ error: "No video found" });
    }

    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="${video.title}.mp3"`,
    });

    ytdl(video.url, { format }).pipe(res);
  } catch (err) {
    console.error("❌ Error streaming:", err.message);
    res.status(500).json({ error: "Audio stream failed: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎧 RudraMediaAPI running on port ${PORT}`);
});
