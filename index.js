const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎶 Rudra Media API is live! Use /audio?q=song name");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query param ?q=song name" });

  try {
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get("Type").get("Video");
    const results = await ytsr(videoFilter.url, { limit: 6 });

    const videos = results.items.filter(item => item.type === "video");

    for (const video of videos) {
      try {
        const info = await ytdl.getInfo(video.url);
        const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
        if (!audioFormats.length) throw new Error("No audio formats found");

        const format = audioFormats[0];
        res.set({
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="${video.title}.mp3"`,
        });

        return ytdl.downloadFromInfo(info, { format }).pipe(res);
      } catch (err) {
        console.log(`⚠️ Failed: ${video.title} – ${err.message}`);
        // Try next video
      }
    }

    return res.status(404).json({ error: "No playable audio found from search results" });

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Rudra Media API running on port ${port}`);
});
