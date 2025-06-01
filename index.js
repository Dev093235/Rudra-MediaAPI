const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎵 Rudra Media API is live. Use /audio?q=song name");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query ?q=song name" });

  try {
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get("Type").get("Video");
    const searchResults = await ytsr(videoFilter.url, { limit: 10 });

    const videos = searchResults.items.filter(item => item.type === "video");

    for (const video of videos) {
      try {
        // Skip long videos (like movies or 1hr+ live videos)
        const durationSeconds = convertDurationToSeconds(video.duration);
        if (durationSeconds > 600) continue;

        const info = await ytdl.getInfo(video.url);
        const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
        if (!audioFormats.length) throw new Error("No audio formats");

        const format = audioFormats[0];

        res.set({
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="${sanitizeFilename(video.title)}.mp3"`,
        });

        return ytdl.downloadFromInfo(info, { format }).pipe(res);
      } catch (err) {
        console.log(`❌ Skipped: ${video.title} – ${err.message}`);
      }
    }

    return res.status(404).json({ error: "No playable audio found from search results" });
  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    return res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

function convertDurationToSeconds(duration) {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "");
}

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
