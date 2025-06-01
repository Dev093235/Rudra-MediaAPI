const express = require('express');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('🎧 Rudra Media API Working — use /audio?q=songname');
});

app.get('/audio', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).send('❌ Please provide ?q=songname');

  try {
    const result = await ytSearch(q);
    const video = result.videos[0];
    if (!video) return res.status(404).send('❌ No video found');

    const url = video.url;

    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25 // bigger buffer
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      res.status(500).send('⚠️ Audio stream failed. Try another song.');
    });

    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    stream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('💥 Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`🎧 RudraMediaAPI running on port ${PORT}`);
});
