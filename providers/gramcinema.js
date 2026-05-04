/**
 * GramCinema (Hashhackers) - Private Local Auth Version
 * Filename: providers/gramcinema.js
 */

const CONFIG = {
    LOCAL_COOKIE_URL: "http://192.168.1.3:8080/cookie.txt",
    TMDB_API_KEY: "d131017ccc6e5462a81c9304d21476de",
    USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

/**
 * Fetches your private Febbox/Showbox UI token from your local HTTP server.
 */
async function getLocalToken() {
    const url = CONFIG.LOCAL_COOKIE_URL + "?cache=" + Date.now();
    console.log("[GramCinema] Attempting to load cookie from: " + url);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second limit

        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'text/plain' },
            mode: 'cors' 
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Server returned status: " + response.status);
        
        const token = await response.text();
        const cleanToken = token.trim();

        if (!cleanToken) throw new Error("cookie.txt is empty!");

        console.log("[GramCinema] Token loaded successfully.");
        return cleanToken;
    } catch (err) {
        console.error("[GramCinema] Auth Error: " + err.message);
        console.log("[GramCinema] Ensure your local server is running with --cors at " + CONFIG.LOCAL_COOKIE_URL);
        return null;
    }
}

/**
 * Helper to handle JSON fetches with consistent headers.
 */
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
            console.error(`[GramCinema] HTTP Error: ${res.status} for ${url}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`[GramCinema] Fetch failed for ${url}:`, err.message);
        return null;
    }
}

/**
 * Main Scraper Function
 */
async function getStreams(tmdbId, mediaType) {
    console.log(`[GramCinema] Searching for: ${tmdbId} (${mediaType})`);

    // 1. Get the private token first
    const token = await getLocalToken();
    if (!token) return [];

    // 2. Fetch Metadata from TMDB
    const isImdb = String(tmdbId).startsWith("tt");
    const tmdbUrl = isImdb 
        ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}&external_source=imdb_id`
        : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${CONFIG.TMDB_API_KEY}`;

    const tmdbData = await fetchJson(tmdbUrl);
    if (!tmdbData) return [];

    const movieData = isImdb ? tmdbData.movie_results?.[0] : tmdbData;
    if (!movieData) {
        console.error("[GramCinema] No movie metadata found.");
        return [];
    }

    const title = movieData.title || movieData.name;
    const year = (movieData.release_date || "").split('-')[0];
    const query = encodeURIComponent(`${title} ${year}`.trim());

    // 3. Search the Hashhackers/Showbox Database
    const HASH_HEADERS = {
        "Authorization": `Bearer ${token}`,
        "Origin": "https://bollywood.eu.org",
        "Referer": "https://bollywood.eu.org/"
    };

    const searchUrl = `https://tga-hd.api.hashhackers.com/mix_media_files/search?q=${query}&page=1`;
    const searchData = await fetchJson(searchUrl, { headers: HASH_HEADERS });

    if (!searchData || !searchData.files || searchData.files.length === 0) {
        console.log("[GramCinema] No files found in database.");
        return [];
    }

    // 4. Generate direct stream links for top results
    const topFiles = searchData.files.slice(0, 5);
    const streamPromises = topFiles.map(async (file) => {
        const genUrl = `https://tga-hd.api.hashhackers.com/genLink?type=mix_media&id=${file.id}`;
        const linkData = await fetchJson(genUrl, { headers: HASH_HEADERS });

        if (linkData && linkData.success && linkData.url) {
            let quality = "Auto";
            const fn = file.file_name.toLowerCase();
            if (fn.includes("2160p") || fn.includes("4k")) quality = "4K";
            else if (fn.includes("1080p")) quality = "1080p";
            else if (fn.includes("720p")) quality = "720p";

            return {
                name: "GramCinema",
                title: file.file_name.substring(0, 50) + (file.file_name.length > 50 ? "..." : ""),
                url: linkData.url,
                quality: quality
            };
        }
        return null;
    });

    const results = await Promise.all(streamPromises);
    const finalStreams = results.filter(r => r !== null);
    
    console.log(`[GramCinema] Found ${finalStreams.length} active streams.`);
    return finalStreams;
}

// Export for the app
module.exports = { getStreams };
