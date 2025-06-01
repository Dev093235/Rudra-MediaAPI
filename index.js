const express = require("express");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Rudra Media API is live. Use /audio?q=songname");
});

app.get("/audio", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send("Query not provided");

  try {
    const searchResult = await ytSearch(query);
    const song = searchResult.videos[0];
    if (!song) return res.status(404).send("Song not found");

    const url = song.url;

    res.setHeader("Content-Disposition", `attachment; filename="${song.title}.mp3"`);
    ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error processing song");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🎧 RudraMediaAPI running on port ${PORT}`);
});
