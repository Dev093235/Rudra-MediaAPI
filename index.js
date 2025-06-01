const express = require('express');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/audio', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).send('Please provide ?q=songname');

  try {
    const r = await ytSearch(q);
    const videos = r.videos;
    if (!videos.length) return res.status(404).send('No video found');

    const video = videos[0];

    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);

  } catch (err) {
    res.status(500).send('Error fetching audio');
  }
});

app.listen(PORT, () => {
  console.log(`RudraMediaAPI running on port ${PORT}`);
});
