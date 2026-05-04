/**
 * Hashhackers - Local Auth Version
 */

// 1. Configuration - Set your local IP here
const LOCAL_COOKIE_URL = "http://192.168.1.3:8080/cookie.txt";
const TMDB_KEY = "d131017ccc6e5462a81c9304d21476de";

async function getLocalToken() {
    console.log("[Auth] Attempting to fetch token from: " + LOCAL_COOKIE_URL);
    try {
        // We use { mode: 'cors' } in case the server supports it, 
        // or just a standard fetch if it's the same origin.
        const response = await fetch(LOCAL_COOKIE_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("File not found on server");
        
        const token = await response.text();
        const cleanToken = token.trim();
        
        if (!cleanToken) throw new Error("cookie.txt is empty");
        
        console.log("[Auth] Token loaded successfully.");
        return cleanToken;
    } catch (err) {
        console.error("[Auth] Error loading cookie.txt: " + err.message);
        return null;
    }
}

async function fetchJson(url, options = {}) {
    return fetch(url, options)
        .then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .catch(err => {
            console.error("[Fetch Error]", err.message);
            return null;
        });
}

async function getStreams(tmdbId, mediaType) {
    // A. Grab the token from your local server first
    const token = await getLocalToken();
    if (!token) return [];

    // B. Get TMDB Metadata
    const isImdb = String(tmdbId).startsWith("tt");
    const tmdbUrl = isImdb 
        ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`
        : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`;

    const tmdbData = await fetchJson(tmdbUrl);
    const movieData = isImdb ? tmdbData?.movie_results?.[0] : tmdbData;
    
    if (!movieData) {
        console.error("[Hashhackers] Metadata fetch failed");
        return [];
    }

    const title = movieData.title || movieData.name;
    const year = (movieData.release_date || "").split('-')[0];
    const query = encodeURIComponent(`${title} ${year}`.trim());

    // C. Search Hashhackers with your private token
    const HASH_HEADERS = {
        "Authorization": "Bearer " + token,
        "Accept": "*/*"
    };

    const searchUrl = `https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`;
    const searchData = await fetchJson(searchUrl, { headers: HASH_HEADERS });

    if (!searchData || !searchData.files) return [];

    // D. Link Generation
    const streamPromises = searchData.files.slice(0, 5).map(file => {
        const genUrl = `https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`;
        return fetchJson(genUrl, { headers: HASH_HEADERS }).then(linkData => {
            if (linkData?.success && linkData.url) {
                return {
                    name: "GramCinema",
                    title: file.file_name,
                    url: linkData.url,
                    quality: file.file_name.includes("1080") ? "1080p" : "720p"
                };
            }
            return null;
        });
    });

    const results = await Promise.all(streamPromises);
    return results.filter(r => r !== null);
}

module.exports = { getStreams };
