/**
 * GramCinema - Final Corrected Version
 */

const CONFIG = {
    // PASTE YOUR UI TOKEN HERE
    UI_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzU1OTg3NTAsIm5iZiI6MTc3NTU5ODc1MCwiZXhwIjoxODA2NzAyNzcwLCJkYXRhIjp7InVpZCI6MTQyODU5MSwidG9rZW4iOiIzMTE0YTM5ZWUzODQ1YmNiMmRlMjBmOTc1MDkyM2NlNyJ9fQ.c08D__oKsN3yBjdmcQIWZ8TGneuPsb81yZeR1-8vxDg", 
    TMDB_API_KEY: "d131017ccc6e5462a81c9304d21476de"
};

async function fetchJson(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        return null;
    }
}

async function getStreams(tmdbId, mediaType) {
    // 1. Metadata Fetch
    const isImdb = String(tmdbId).startsWith("tt");
    const tmdbUrl = isImdb 
        ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}&external_source=imdb_id`
        : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}`;

    const tmdbData = await fetchJson(tmdbUrl);
    const movieData = isImdb ? tmdbData?.movie_results?.[0] : tmdbData;
    if (!movieData) return [];

    const title = movieData.title || movieData.name;
    const year = (movieData.release_date || "").split('-')[0];
    // Clean query: remove special characters that might trip up the search
    const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, "");
    const query = encodeURIComponent(`${cleanTitle} ${year}`.trim());

    // 2. The "Magic" Headers
    // These specific headers help bypass the "empty results" block
    const HASH_HEADERS = {
        "Authorization": "Bearer " + CONFIG.UI_TOKEN,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Platform": "android", // Spoofing the app platform
        "X-App-Version": "34",
        "Origin": "https://tga-hd.api.hashhackers.com",
        "Referer": "https://tga-hd.api.hashhackers.com/"
    };

    // 3. Search Request
    const searchUrl = `https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`;
    const searchData = await fetchJson(searchUrl, { headers: HASH_HEADERS });

    if (!searchData || !searchData.files || searchData.files.length === 0) {
        console.log("[GramCinema] No files found. Your token might be expired or the API is blocking this request.");
        return [];
    }

    // 4. Link Generation
    const streamResults = [];
    for (const file of searchData.files.slice(0, 5)) {
        const genUrl = `https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`;
        const linkData = await fetchJson(genUrl, { headers: HASH_HEADERS });

        if (linkData?.success && linkData.url) {
            streamResults.push({
                name: "GramCinema",
                title: file.file_name,
                url: linkData.url,
                quality: file.file_name.includes("1080") ? "1080p" : "720p"
            });
        }
    }

    return streamResults;
}

module.exports = { getStreams };
