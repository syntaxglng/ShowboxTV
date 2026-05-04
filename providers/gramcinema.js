/**
 * GramCinema - Hardcoded Test Version
 * Purpose: Bypass local server to verify API connectivity
 */

const CONFIG = {
    // PASTE YOUR ACTUAL UI TOKEN HERE BETWEEN THE QUOTES
    TEST_TOKEN: "", 
    
    TMDB_API_KEY: "d131017ccc6e5462a81c9304d21476de",
    USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

async function fetchJson(url, options = {}) {
    const defaultHeaders = {
        "User-Agent": CONFIG.USER_AGENT,
        "Accept": "application/json"
    };

    try {
        const res = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (!res.ok) {
            console.error(`[Test] HTTP Error: ${res.status} for ${url}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`[Test] Network failure:`, err.message);
        return null;
    }
}

async function getStreams(tmdbId, mediaType) {
    console.log("[Test] Starting search with hardcoded token...");

    if (!CONFIG.TEST_TOKEN || CONFIG.TEST_TOKEN.includes("PASTE_YOUR")) {
        console.error("[Test] You forgot to paste your token into the code!");
        return [];
    }

    // 1. Get Metadata
    const isImdb = String(tmdbId).startsWith("tt");
    const tmdbUrl = isImdb 
        ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}&external_source=imdb_id`
        : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}`;

    const tmdbData = await fetchJson(tmdbUrl);
    const movieData = isImdb ? tmdbData?.movie_results?.[0] : tmdbData;
    
    if (!movieData) {
        console.error("[Test] TMDB metadata failed.");
        return [];
    }

    const title = movieData.title || movieData.name;
    const year = (movieData.release_date || "").split('-')[0];
    const query = encodeURIComponent(`${title} ${year}`.trim());

    // 2. Search Hashhackers
    const HASH_HEADERS = {
        "Authorization": "Bearer " + CONFIG.TEST_TOKEN,
        "Origin": "https://bollywood.eu.org",
        "Referer": "https://bollywood.eu.org/"
    };

    const searchUrl = `https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`;
    console.log("[Test] Searching: " + searchUrl);
    
    const searchData = await fetchJson(searchUrl, { headers: HASH_HEADERS });

    if (!searchData || !searchData.files || searchData.files.length === 0) {
        console.log("[Test] No results found. Either the movie is missing or the token is invalid.");
        return [];
    }

    // 3. Link Gen
    const results = [];
    for (const file of searchData.files.slice(0, 3)) {
        const genUrl = `https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`;
        const linkData = await fetchJson(genUrl, { headers: HASH_HEADERS });

        if (linkData?.success && linkData.url) {
            results.push({
                name: "GramCinema (Test)",
                title: file.file_name,
                url: linkData.url,
                quality: file.file_name.includes("1080") ? "1080p" : "720p"
            });
        }
    }

    console.log(`[Test] Success! Found ${results.length} streams.`);
    return results;
}

module.exports = { getStreams };
