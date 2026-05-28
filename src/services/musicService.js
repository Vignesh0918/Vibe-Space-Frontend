/**
 * musicService.js
 * 
 * Interacts with the iTunes Search API (completely free and unauthenticated)
 * to search for songs and retrieve audio preview URLs.
 */

const BASE_URL = 'https://itunes.apple.com/search';

/**
 * Searches for songs using the iTunes Search API.
 * 
 * @param {string} query - The search query term.
 * @returns {Promise<Array<{id: string|number, title: string, artist: string, album: string, artwork: string, previewUrl: string}>>} Cleaned array of search results.
 */
export async function searchSongs(query) {
  if (!query || !query.trim()) return [];

  try {
    const url = `${BASE_URL}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=IN`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`iTunes Search API returned status: ${res.status}`);
    }
    const data = await res.json();
    
    return (data.results || []).map((t) => ({
      id: t.trackId,
      title: t.trackName || 'Unknown Song',
      artist: t.artistName || 'Unknown Artist',
      album: t.collectionName || 'Unknown Album',
      artwork: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '300x300bb') : '',
      previewUrl: t.previewUrl || '',
    }));
  } catch (error) {
    console.error('Error fetching from iTunes Search API:', error);
    throw error;
  }
}
