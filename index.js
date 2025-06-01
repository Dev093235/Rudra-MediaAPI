const express = require("express");
const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎵 Rudra Media API is running!");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing 'q' query param" });

  try {
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get("Type").get("Video");

    const results = await ytsr(videoFilter.url, { limit: 1 });
    const video = results.items[0];

    if (!video || !video.url) {
      return res.status(404).json({ error: "No video found" });
    }

    const info = await ytdl.getInfo(video.url);
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    const bestFormat = audioFormats[0];

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="${video.title}.mp3"`,
    });

    ytdl.downloadFromInfo(info, { format: bestFormat }).pipe(res);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Audio stream failed", detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Rudra Media API is live on port ${port}`);
});
