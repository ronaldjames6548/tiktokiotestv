// src/pages/api/tik.json.ts
// Route: POST /api/tik.json → automatically returns application/json

import type { APIRoute } from 'astro';

const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\//i;

// Fetch with timeout (8.5s to stay under Vercel 10s limit)
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error('Request timed out');
    throw error;
  }
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    console.log("Resolving short URL:", url);
    const response = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    });
    console.log("Resolved to:", response.url);
    return response.url;
  } catch (error) {
    console.error("URL resolution failed:", error);
    return url;
  }
}

// =============== PRIMARY: ssstik.io ===============
async function ssstik(url: string) {
  if (!tiktokRegex.test(url)) throw new Error("Invalid URL");

  const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

  const homeRes = await fetchWithTimeout("https://ssstik.io", { headers: { "user-agent": userAgent } });
  if (!homeRes.ok) throw new Error(`ssstik home failed: ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  const ttMatch = /tt:'([\w\d]+)'/.exec(homeHtml);
  if (!ttMatch) throw new Error("tt token not found");
  const tt = ttMatch[1];

  const form = new URLSearchParams({ id: url, locale: "en", tt });

  const res = await fetchWithTimeout("https://ssstik.io/abc?url=dl", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent,
      origin: "https://ssstik.io",
      referer: "https://ssstik.io/",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`ssstik POST failed: ${res.status}`);
  const html = await res.text();

  let title = "";
  const titlePatterns = [
    /<h2[^>]*class=["']?tiktitle[^>]*>([\s\S]*?)<\/h2>/i,
    /<p[^>]*class=["']?description[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*class=["']?result-overlay[^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const pat of titlePatterns) {
    const m = pat.exec(html);
    if (m?.[1]) {
      title = m[1].replace(/<[^>]+>/g, "").trim();
      if (title) break;
    }
  }

  let creator = "";
  const creatorMatch = html.match(/@([a-zA-Z0-9_.]{1,24})/);
  if (creatorMatch) creator = creatorMatch[1];

  let thumbnail = "";
  const thumbMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*class=["']?pure-img/i) || html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (thumbMatch) thumbnail = thumbMatch[1];

  // Stats
  let likes = 0, views = 0, comments = 0, shares = 0;
  const statTexts = html.match(/(\d[\d.,]*)\s*(Likes|Views|Comments|Shares)/gi) || [];
  statTexts.forEach(str => {
    const num = parseInt(str.replace(/[.,\s]/g, ''), 10);
    if (str.includes("Likes")) likes = num;
    else if (str.includes("Views")) views = num;
    else if (str.includes("Comments")) comments = num;
    else if (str.includes("Shares")) shares = num;
  });

  // Music
  let musicTitle = "", musicAuthor = "";
  const musicMatch = html.match(/<p[^>]*class=["']?music[^>]*>([\s\S]*?)<\/p>/i);
  if (musicMatch) {
    const text = musicMatch[1].replace(/<[^>]+>/g, "").trim();
    const parts = text.split(" - ");
    if (parts.length >= 2) {
      musicAuthor = parts[0].trim();
      musicTitle = parts[1].trim();
    } else musicTitle = text;
  }

  // Links
  const hrefs: string[] = [];
  const hrefRegex = /href="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = hrefRegex.exec(html))) hrefs.push(m[1]);

  const processedHrefs = hrefs.map(h => {
    if (h.includes("ssscdn") || h.includes("tikcdn")) {
      try {
        const parts = h.split("/");
        if (parts.length > 5) return atob(parts.slice(5).join("/"));
      } catch {}
    }
    return h;
  });

  const videoUrls = processedHrefs.filter(u => u.endsWith(".mp4") || (u.includes("video") && !u.includes("music")));
  const audioUrls = processedHrefs.filter(u => u.endsWith(".mp3") || u.includes("music") || u.includes("audio"));
  const videos = videoUrls.slice(0, 2);
  const audio = audioUrls[0] || "";

  // Slides
  const slide: string[] = [];
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  while ((m = imgRegex.exec(html))) {
    const src = m[1];
    if ((src.includes(".jpg") || src.includes(".jpeg") || src.includes("photo")) && src !== thumbnail) {
      slide.push(src);
    }
  }

  return { title, creator, thumbnail, videos, audio, musicTitle, musicAuthor, musicDuration: 0, slide, likes, views, comments, shares };
}

// =============== SECONDARY: tiksave.io ===============
async function tiksave(url: string) {
  if (!tiktokRegex.test(url)) throw new Error("Invalid URL");

  const form = new URLSearchParams({ q: url, lang: "en" });

  const res = await fetchWithTimeout("https://tiksave.io/api/ajaxSearch", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      origin: "https://tiksave.io",
      referer: "https://tiksave.io/",
    },
    body: form.toString(),
  });

  if (!res.ok) throw new Error(`TikSave failed: ${res.status}`);
  const json: any = await res.json();
  const html = json?.data || json?.data?.data;
  if (typeof html !== "string") throw new Error("Invalid TikSave response");

  let title = "", creator = "";
  const titlePatterns = [/class=["']content["'][^>]*>([\s\S]*?)<\/div>/i, /class=["']desc["'][^>]*>([\s\S]*?)<\/div>/i];
  for (const pat of titlePatterns) {
    const m = pat.exec(html);
    if (m?.[1]) {
      title = m[1].replace(/<[^>]+>/g, "").trim();
      if (title) break;
    }
  }
  const creatorMatch = html.match(/@([a-zA-Z0-9_.]{1,24})/);
  if (creatorMatch) creator = creatorMatch[1];

  let thumbnail = "";
  const thumbMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class=["']tik-left/i);
  if (thumbMatch) thumbnail = thumbMatch[1];

  let likes = 0, views = 0, comments = 0, shares = 0;
  const statMatches = html.match(/(\d[\d.,]*)\s*(Likes|Views|Comments|Shares)/gi);
  if (statMatches) {
    statMatches.forEach(str => {
      const num = parseInt(str.replace(/[.,\s]/g, ''), 10);
      if (str.includes("Likes")) likes = num;
      else if (str.includes("Views")) views = num;
      else if (str.includes("Comments")) comments = num;
      else if (str.includes("Shares")) shares = num;
    });
  }

  const allHrefs: string[] = [];
  const hrefRegex = /href="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = hrefRegex.exec(html))) allHrefs.push(m[1]);

  const videoUrls = allHrefs.filter(u => u.includes(".mp4") || (u.includes("video") && !u.includes("audio")));
  const audioUrls = allHrefs.filter(u => u.includes(".mp3") || u.includes("audio"));
  const videos = videoUrls.slice(0, 2);
  const audio = audioUrls[0] || "";

  const slide: string[] = [];
  const ulMatch = /<ul[^>]+class=["'][^"']*download-box[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (ulMatch) {
    const imgRegex = /src="([^"]+)"/g;
    while ((m = imgRegex.exec(ulMatch[1]))) slide.push(m[1]);
  }

  return { title, creator, thumbnail, videos, audio, musicTitle: "", musicAuthor: "", musicDuration: 0, slide, likes, views, comments, shares };
}

// =============== LIBRARY FALLBACK: @tobyg74/tiktok-api-dl ===============
function extractStats(result: any) {
  return {
    likes: result.statistics?.diggCount || result.stats?.diggCount || result.diggCount || result.statistics?.likeCount || result.stats?.likeCount || 0,
    views: result.statistics?.playCount || result.stats?.playCount || result.playCount || 0,
    comments: result.statistics?.commentCount || result.stats?.commentCount || result.commentCount || 0,
    shares: result.statistics?.shareCount || result.stats?.shareCount || result.shareCount || 0,
    collects: result.statistics?.collectCount || result.stats?.collectCount || result.collectCount || 0,
  };
}

function transformLibraryResponse(libraryData: any) {
  const result = libraryData.result;
  if (!result) return null;

  const thumbnail = result.cover?.[0] || result.originCover?.[0] || result.video?.cover?.[0] || null;
  const stats = extractStats(result);

  if (stats.views < 1000) throw new Error("Suspiciously low views");

  const music = result.music || {};
  const audio = music.playUrl?.[0] || "";
  const musicTitle = music.title || "";
  const musicAuthor = music.authorName || music.author || "";

  return {
    title: result.desc || "No description",
    creator: result.author?.uniqueId || result.author?.nickname || "",
    thumbnail,
    videos: [
      result.video?.downloadAddr?.[0] || result.video?.playAddr?.[0] || "",
      result.video?.downloadAddr?.[1] || result.video?.playAddr?.[1] || ""
    ].filter(Boolean),
    audio,
    musicTitle,
    musicAuthor,
    musicDuration: music.duration || 0,
    slide: result.images || [],
    ...stats
  };
}

async function tryLibraryDownloader(url: string) {
  const Tiktok = require('@tobyg74/tiktok-api-dl');
  const versions = ["v3", "v2", "v1"];
  let lastError;

  for (const version of versions) {
    try {
      const data = await Tiktok.Downloader(url, { version });
      if (data.status === "success" && data.result) {
        const transformed = transformLibraryResponse(data);
        if (transformed) return transformed;
      }
    } catch (e: any) {
      lastError = e;
    }
  }
  throw lastError || new Error("Library failed");
}

// =============== FINAL FALLBACK: TikWM ===============
async function fallbackToTikWM(url: string) {
  const res = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("TikWM HTTP error");
  const data = await res.json();
  if (data.code !== 0 || !data.data) throw new Error("TikWM invalid data");

  const d = data.data;
  const music = d.music_info || {};
  return {
    title: d.title || "No description",
    creator: d.author?.unique_id || d.author?.nickname || "",
    thumbnail: d.cover || d.origin_cover || "",
    videos: [d.play, d.hdplay || d.play].filter(Boolean),
    audio: music.play || music.url || "",
    musicTitle: music.title || "",
    musicAuthor: music.author || "",
    musicDuration: music.duration || 0,
    slide: d.images || [],
    likes: d.digg_count || 0,
    views: d.play_count || 0,
    comments: d.comment_count || 0,
    shares: d.share_count || 0,
  };
}

// =============== MAIN HANDLER ===============
export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, quality = 'sd' } = await request.json();

    if (!url || typeof url !== "string" || !tiktokRegex.test(url)) {
      return new Response(JSON.stringify({ error: "Invalid TikTok URL" }), { status: 400 });
    }

    let processedUrl = url;
    if (url.includes('/t/') || url.includes('vm.tiktok.com')) {
      processedUrl = await resolveShortUrl(url);
    }

    let result: any;

    try {
      result = await ssstik(processedUrl);
      if (result.videos.length === 0 && result.slide.length === 0) throw new Error("No media from ssstik");
    } catch (e) {
      console.log("ssstik failed → trying tiksave");
      try {
        result = await tiksave(processedUrl);
        if (result.videos.length === 0 && result.slide.length === 0) throw new Error("No media from tiksave");
      } catch (e) {
        console.log("tiksave failed → trying library");
        try {
          result = await tryLibraryDownloader(processedUrl);
        } catch (e) {
          console.log("library failed → trying TikWM");
          result = await fallbackToTikWM(processedUrl);
        }
      }
    }

    const isPhoto = result.slide.length > 0;
    const videos = result.videos || [];
    const hdVideo = videos.find((v: string) => v.includes('hd') || v.includes('HD') || v.includes('snapcdn')) || videos[1] || videos[0];

    const responseData: any = {
      type: isPhoto ? "image" : "video",
      description: result.title || "No description",
      creator: result.creator || "",
      thumbnail: result.thumbnail || "",
      likes: result.likes || 0,
      views: result.views || 0,
      comments: result.comments || 0,
      shares: result.shares || 0,
      musicTitle: result.musicTitle || "",
      musicAuthor: result.musicAuthor || "",
      musicDuration: result.musicDuration || 0,
    };

    if (isPhoto) {
      responseData.images = result.slide;
    } else {
      responseData.videos = videos;
      responseData.video = quality === 'hd' ? hdVideo : videos[0];
      responseData.videoHd = hdVideo;
    }

    if (result.audio) responseData.music = result.audio;

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (err: any) {
    console.error("All methods failed:", err.message);
    const status = err.message.includes("timeout") ? 408 :
                   err.message.includes("private") || err.message.includes("deleted") ? 404 : 500;
    const message = status === 408 ? "Request timed out" :
                    status === 404 ? "Video is private or deleted" : "Failed to process video";

    return new Response(JSON.stringify({ error: message }), { status });
  }
};
