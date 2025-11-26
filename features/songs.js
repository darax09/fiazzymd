const play = require('play-dl');
const fs = require('fs');
const path = require('path');

/**
 * Search for songs on YouTube
 * @param {string} query - Search query (e.g., "smooth criminal by michael jackson")
 * @returns {Promise<Array>} Array of search results with title, artist, url, thumbnail, duration
 */
async function searchSongs(query) {
  try {
    const results = await play.search(query, { limit: 5, source: { youtube: 'video' } });

    return results.map((video, index) => ({
      number: index + 1,
      title: video.title,
      artist: video.channel.name,
      url: video.url,
      thumbnail: video.thumbnails[0]?.url,
      duration: formatDuration(video.durationInSec),
      views: video.views
    }));
  } catch (error) {
    console.error('❌ Search error:', error);
    throw new Error('Failed to search for songs');
  }
}

// Helper to format duration from seconds to MM:SS
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Download song as MP3
 * @param {string} url - YouTube video URL
 * @param {string} fileName - Output file name (without extension)
 * @returns {Promise<string>} Path to downloaded MP3 file
 */
async function downloadSong(url, fileName) {
  try {
    // Create downloads directory if it doesn't exist
    const downloadsDir = path.join(__dirname, '..', 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Sanitize filename (remove special characters)
    const sanitized = fileName.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_');
    const outputPath = path.join(downloadsDir, `${sanitized}.mp3`);

    console.log('📥 Starting download:', url);
    console.log('💾 Output path:', outputPath);

    // Get video info
    const info = await play.video_info(url);
    if (!info) {
      throw new Error('Could not get video info');
    }

    // Get audio stream
    const stream = await play.stream(url, { quality: 2 }); // quality 2 = high audio

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);

      // Handle errors
      stream.stream.on('error', (error) => {
        console.error('❌ Stream error:', error);
        writeStream.end();
        reject(new Error('Failed to download audio stream'));
      });

      writeStream.on('error', (error) => {
        console.error('❌ Write error:', error);
        reject(new Error('Failed to write audio file'));
      });

      writeStream.on('finish', () => {
        console.log('✅ Download completed:', outputPath);
        resolve(outputPath);
      });

      // Pipe stream to file
      stream.stream.pipe(writeStream);
    });

  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  }
}

/**
 * Format search results as text message
 * @param {Array} results - Array of search results
 * @param {string} prefix - Bot command prefix
 * @returns {string} Formatted text
 */
function formatSearchResults(results, prefix) {
  if (!results || results.length === 0) {
    return '❌ No songs found! Try a different search term.';
  }

  let text = '🔍 *SONG SEARCH RESULTS*\n\n';
  text += '📝 Reply with a number (1-5) to download\n\n';

  results.forEach((song) => {
    text += `*${song.number}.* ${song.title}\n`;
    text += `   👤 ${song.artist}\n`;
    text += `   ⏱️ ${song.duration} • 👁️ ${formatViews(song.views)}\n\n`;
  });

  text += `💡 Example: Reply with "1" to download the first song`;

  return text;
}

/**
 * Format view count (e.g., 1000000 -> 1M)
 * @param {number} views - View count
 * @returns {string} Formatted view count
 */
function formatViews(views) {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

module.exports = {
  searchSongs,
  downloadSong,
  formatSearchResults
};
