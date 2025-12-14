import { NextResponse } from "next/server"

const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com)\//

async function resolveShortUrl(url: string): Promise<string> {
  try {
    console.log("Resolving short URL:", url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      },
    });
    
    const resolvedUrl = response.url;
    console.log("Resolved to:", resolvedUrl);
    return resolvedUrl;
  } catch (error) {
    console.error("URL resolution failed:", error);
    return url;
  }
}

// Helper function to safely extract stats from multiple possible paths
function extractStats(result: any) {
  console.log("=== EXTRACTING STATS ===");
  console.log("Full result object keys:", Object.keys(result));
  
  const possiblePaths = {
    'result.statistics': result.statistics,
    'result.stats': result.stats,
    'result direct': {
      diggCount: result.diggCount,
      playCount: result.playCount,
      commentCount: result.commentCount,
      shareCount: result.shareCount,
      collectCount: result.collectCount
    }
  };
  
  console.log("Possible stat paths:", JSON.stringify(possiblePaths, null, 2));
  
  const stats = {
    likes: result.statistics?.diggCount 
      || result.stats?.diggCount 
      || result.diggCount
      || result.statistics?.likeCount 
      || result.stats?.likeCount
      || 0,
      
    views: result.statistics?.playCount 
      || result.stats?.playCount 
      || result.playCount
      || result.statistics?.viewCount
      || result.stats?.viewCount
      || 0,
      
    comments: result.statistics?.commentCount 
      || result.stats?.commentCount 
      || result.commentCount
      || 0,
      
    shares: result.statistics?.shareCount 
      || result.stats?.shareCount 
      || result.shareCount
      || 0,
      
    collects: result.statistics?.collectCount
      || result.stats?.collectCount
      || result.collectCount
      || 0
  };
  
  console.log("Extracted stats:", stats);
  console.log("======================");
  
  return stats;
}

function transformLibraryResponse(libraryData: any) {
  const result = libraryData.result;
  if (!result) return null;

  console.log("=== FULL LIBRARY RESPONSE ===");
  console.log(JSON.stringify(libraryData, null, 2));
  console.log("============================");

  const thumbnail = result.cover?.[0] 
    || result.originCover?.[0] 
    || result.video?.cover?.[0] 
    || result.video?.originCover?.[0]
    || result.dynamicCover?.[0] 
    || result.video?.dynamicCover?.[0]
    || null;

  const stats = extractStats(result);

  // Reject response if views are invalid
  if (stats.views === 0 || stats.views < 1000) {
    console.log("⚠️ Library returned suspiciously low views. Throwing to trigger fallback.");
    // Will be caught in tryLibraryDownloader
    throw new Error("Invalid views count from library");
  }

  const music = result.music || {};
  const audio = music.playUrl?.[0] || music.play || "";
  const musicTitle = music.title || "";
  const musicAuthor = music.author || music.authorName || "";
  const musicDuration = music.duration || 0;

  return {
    title: result.desc || result.title || "No description available",
    creator: result.author?.uniqueId || result.author?.nickname || "",
    thumbnail: thumbnail,
    videos: [
      result.video?.downloadAddr?.[0] || result.video?.playAddr?.[0] || "",
      result.video?.downloadAddr?.[1] || result.video?.downloadAddr?.[0] || result.video?.playAddr?.[1] || result.video?.playAddr?.[0] || ""
    ].filter(Boolean),
    audio,
    musicTitle,
    musicAuthor,
    musicDuration,
    slide: result.images || [],
    likes: stats.likes,
    views: stats.views,
    comments: stats.comments,
    shares: stats.shares
  };
}

async function tryLibraryDownloader(url: string) {
  const Tiktok = require('@tobyg74/tiktok-api-dl');
  const versions = ["v3", "v2", "v1"];
  let lastError = null;

  for (const version of versions) {
    try {
      console.log(`\n=== Trying TikTok library version ${version} ===`);
      
      const result = await Tiktok.Downloader(url, { version });

      console.log(`Raw ${version} response status:`, result.status);
      
      if (result.status === "success" && result.result) {
        const transformedData = transformLibraryResponse(result);
        if (transformedData) {
          console.log(`✅ Success with library version ${version}`);
          return transformedData;
        }
      }
      
      throw new Error(result.message || `Library version ${version} returned no valid data`);
      
    } catch (error: any) {
      console.log(`❌ Library version ${version} failed or returned invalid stats:`, error.message);
      lastError = error;
    }
  }

  throw lastError || new Error("All library downloader versions failed or returned invalid stats");
}

async function fallbackToExternalServices(url: string) {
  const services = [
    {
      name: 'TikWM',
      url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url.trim())}`,
      transform: (data: any) => {
        console.log("=== TIKWM FULL RESPONSE ===");
        console.log(JSON.stringify(data, null, 2));
        console.log("=========================");
        
        const likes = data.data?.digg_count || 0;
        const views = data.data?.play_count || 0;
        const comments = data.data?.comment_count || 0;
        const shares = data.data?.share_count || 0;
        
        console.log("TikWM extracted stats:", { likes, views, comments, shares });
        
        const music = data.data?.music_info || data.data?.music || {};
        const audio = typeof music === 'string' ? music : music.play || music.url || "";
        const musicTitle = music.title || "";
        const musicAuthor = music.author || "";
        const musicDuration = music.duration || 0;

        return {
          title: data.data?.title || "No description available",
          creator: data.data?.author?.unique_id || data.data?.author?.nickname || "",
          thumbnail: data.data?.cover || data.data?.origin_cover || data.data?.dynamic_cover || "",
          videos: [
            data.data?.play || "",
            data.data?.hdplay || data.data?.play || ""
          ].filter(Boolean),
          audio,
          musicTitle,
          musicAuthor,
          musicDuration,
          slide: data.data?.images || [],
          likes,
          views,
          comments,
          shares
        };
      }
    }
  ];

  for (const service of services) {
    try {
      console.log(`\n=== Trying fallback service: ${service.name} ===`);
      
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (service.name === 'TikWM' && data.code === 0 && data.data) {
        console.log(`✅ ${service.name} succeeded`);
        return service.transform(data);
      }
      
    } catch (error: any) {
      console.log(`❌ ${service.name} fallback failed:`, error.message);
    }
  }

  throw new Error("All fallback services also failed");
}

async function tiktok(url: string) {
  if (!tiktokRegex.test(url)) {
    throw new Error("Invalid URL")
  }
  const form = new URLSearchParams()
  form.append("q", url)
  form.append("lang", "id")
  const res = await fetch("https://tiksave.io/api/ajaxSearch", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://tiksave.io",
      referer: "https://tiksave.io/id/download-tiktok-mp3",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    },
    body: form.toString(),
  })
  if (!res.ok) {
    throw new Error(`TikSave returned ${res.status}: ${res.statusText}`)
  }
  const json: any = await res.json()

  const html = json?.data || json?.data?.data
  if (typeof html !== "string") {
    throw new Error("Unexpected response from TikSave")
  }
  
  let title = ""
  let creator = ""
  {
    const patterns = [
      /<div[^>]*class\s*=\s*["']content["'][^>]*>([\s\S]*?)<\/div>/i,
      /class\s*=\s*["']content["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class\s*=\s*["']desc["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class\s*=\s*["']description["'][^>]*>([\s\S]*?)<\/div>/i,
      /<p[^>]*class\s*=\s*["']desc["'][^>]*>([\s\S]*?)<\/p>/i,
      /<span[^>]*class\s*=\s*["']desc["'][^>]*>([\s\S]*?)<\/span>/i,
      /class\s*=\s*["']tik-left["'][\s\S]*?<div[^>]*class\s*=\s*["']content["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class\s*=\s*["']content["'][^>]*>([\s\S]*?)(?:<\/div>|$)/i,
      /<div[^>]*class\s*=\s*["']text["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class\s*=\s*["']caption["'][^>]*>([\s\S]*?)<\/div>/i
    ]
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      const match = pattern.exec(html)
      if (match && match[1]) {
        const rawContent = match[1]
        title = rawContent.replace(/<[^>]+>/g, "").trim()
        if (title && title.length > 0) {
          break
        }
      }
    }
    
    const textContentPatterns = [
      /<div[^>]*>([^<]*#[^<]*?)<\/div>/i,
      /<p[^>]*>([^<]*#[^<]*?)<\/p>/i,
      /<span[^>]*>([^<]*#[^<]*?)<\/span>/i
    ]
    
    if (!title || title.length === 0) {
      for (let i = 0; i < textContentPatterns.length; i++) {
        const pattern = textContentPatterns[i]
        const match = pattern.exec(html)
        if (match && match[1]) {
          const foundText = match[1].trim()
          if (foundText && foundText.length > 5) {
            title = foundText
            break
          }
        }
      }
    }
    
    const creatorMatch = /class\s*=\s*["']tik-left["'][\s\S]*?<div[^>]*class\s*=\s*["']user["'][^>]*>.*?<a[^>]*>@([^<]+)<\/a>/i.exec(html)
    if (creatorMatch) {
      creator = creatorMatch[1]
    } else {
      const altCreatorMatch = /@([a-zA-Z0-9_.]+)/i.exec(html)
      if (altCreatorMatch) {
        creator = altCreatorMatch[1]
      }
    }
  }

  let thumbnail = ""
  {
    const match = /class\s*=\s*["']tik-left["'][\s\S]*?<img[^>]*src="([^"]+)"/i.exec(html)
    if (match) {
      thumbnail = match[1]
    }
  }

  let videos: string[] = []
  let audio = ""
  let musicTitle = ""
  let musicAuthor = ""
  let musicDuration = 0
  {
    const patterns = [
      /class\s*=\s*["']dl-action["'][\s\S]*?<\/div>/i,
      /class\s*=\s*["']download["'][\s\S]*?<\/div>/i,
      /class\s*=\s*["']download-box["'][\s\S]*?<\/div>/i,
      /<div[^>]*class\s*=\s*["'][^"']*download[^"']*["'][^>]*>[\s\S]*?<\/div>/i
    ]
    
    let section = ""
    for (const pattern of patterns) {
      const match = pattern.exec(html)
      if (match && match[0]) {
        section = match[0]
        break
      }
    }
    
    if (section) {
      const hrefs = [] as string[]
      const hrefRegex = /href="([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = hrefRegex.exec(section))) {
        hrefs.push(m[1])
      }
      
      const videoUrls = hrefs.filter(url => 
        url.includes('.mp4') || 
        url.includes('video') || 
        (!url.includes('.mp3') && !url.includes('audio'))
      )
      const audioUrls = hrefs.filter(url => 
        url.includes('.mp3') || 
        url.includes('audio')
      )
      
      const snapcdnUrls = videoUrls.filter(url => url.includes('snapcdn.app'))
      const otherVideoUrls = videoUrls.filter(url => !url.includes('snapcdn.app'))
      
      videos = [...snapcdnUrls, ...otherVideoUrls].slice(0, 2)
      
      if (audioUrls.length > 0) {
        audio = audioUrls[0]
      }
      
      console.log("=== TIKSAVE.IO EXTRACTION DEBUG ===")
      console.log("All hrefs found:", hrefs)
      console.log("Video URLs:", videoUrls)
      console.log("Audio URLs:", audioUrls)
      console.log("snapcdn URLs:", snapcdnUrls)
      console.log("Other video URLs:", otherVideoUrls)
      console.log("Final videos array:", videos)
      console.log("Final audio:", audio)
      console.log("===================================")
    } else {
      console.log("=== FALLBACK: SEARCHING ALL HREFS ===")
      const allHrefs = [] as string[]
      const allHrefRegex = /href="([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = allHrefRegex.exec(html))) {
        allHrefs.push(m[1])
      }
      
      const fallbackVideoUrls = allHrefs.filter(url => 
        url.includes('.mp4') || 
        url.includes('video') || 
        (!url.includes('.mp3') && !url.includes('audio') && !url.includes('http'))
      )
      const fallbackAudioUrls = allHrefs.filter(url => 
        url.includes('.mp3') || 
        url.includes('audio')
      )
      
      if (fallbackVideoUrls.length > 0) {
        videos = fallbackVideoUrls.slice(0, 2)
      }
      if (fallbackAudioUrls.length > 0) {
        audio = fallbackAudioUrls[0]
      }
      
      console.log("All hrefs in HTML:", allHrefs)
      console.log("Fallback video URLs:", fallbackVideoUrls)
      console.log("Fallback audio URLs:", fallbackAudioUrls)
      console.log("Final fallback videos:", videos)
      console.log("Final fallback audio:", audio)
      console.log("===================================")
    }
  }

  const slide: string[] = []
  {
    const listMatch = /<ul[^>]*class\s*=\s*["'][^"']*download-box[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html)
    if (listMatch) {
      const listHtml = listMatch[1]
      const imgRegex = /<img[^>]*src="([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = imgRegex.exec(listHtml))) {
        slide.push(m[1])
      }
    }
  }
  return { title, creator, thumbnail, videos, audio, musicTitle, musicAuthor, musicDuration, slide, likes: 0, views: 0, comments: 0, shares: 0 }
}

async function ssstik(url: string) {
  if (!tiktokRegex.test(url)) {
    throw new Error("Invalid URL")
  }

  const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

  // Get session and tt token
  const sesRes = await fetch("https://ssstik.io", {
    headers: {
      "user-agent": userAgent,
    },
  });
  if (!sesRes.ok) {
    throw new Error(`Failed to get ssstik page: ${sesRes.status}`);
  }
  const sesHtml = await sesRes.text();
  const ttMatch = /tt:'([\w\d]+)'/.exec(sesHtml);
  if (!ttMatch) {
    throw new Error("Could not find tt token in ssstik page");
  }
  const tt = ttMatch[1];

  const form = new URLSearchParams();
  form.append("id", url);
  form.append("locale", "id"); // Use 'id' for Indonesian, or 'en' for English
  form.append("tt", tt);

  const res = await fetch("https://ssstik.io/abc?url=dl", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://ssstik.io",
      referer: "https://ssstik.io/",
      "user-agent": userAgent,
    },
    body: form.toString(),
  });
  if (!res.ok) {
    throw new Error(`ssstik returned ${res.status}: ${res.statusText}`);
  }
  const html = await res.text();

  // Extract title/description
  let title = "";
  const descPatterns = [
    /<h2[^>]*>([\s\S]*?)<\/h2>/i,
    /<p[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*id\s*=\s*["']mainresult["'][^>]*>([\s\S]*?)<\/div>/i,
    /<span[^>]*class\s*=\s*["']result-overlay["'][^>]*>([\s\S]*?)<\/span>/i,
  ];
  for (const pattern of descPatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      title = match[1].replace(/<[^>]+>/g, "").trim();
      if (title.length > 0) break;
    }
  }

  // Extract creator
  let creator = "";
  const creatorMatch = /@([\w\d_.]+)/i.exec(html);
  if (creatorMatch) {
    creator = creatorMatch[1];
  }

  // Extract thumbnail
  let thumbnail = "";
  const thumbMatch = /<img[^>]*src="([^"]+)"[^>]*class\s*=\s*["']pure-img["']/i.exec(html) || /<img[^>]*src="([^"]+)"/i.exec(html);
  if (thumbMatch) {
    thumbnail = thumbMatch[1];
  }

  // Extract videos and audio
  let videos: string[] = [];
  let audio = "";
  let musicTitle = ""
  let musicAuthor = ""
  let musicDuration = 0

  const hrefRegex = /href="([^"]+)"/g;
  const hrefs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = hrefRegex.exec(html))) {
    hrefs.push(m[1]);
  }

  // Process hrefs for possible base64 encoding
  const processedHrefs = hrefs.map((h) => {
    if (h.includes("ssscdn.io")) {
      const parts = h.split("/");
      if (parts.length > 5) {
        const toDecode = parts.slice(5).join("/");
        try {
          return atob(toDecode);
        } catch {
          return h;
        }
      }
    }
    return h;
  });

  const videoUrls = processedHrefs.filter((url) =>
    url.endsWith(".mp4") ||
    url.includes("video") ||
    url.includes("download") && !url.includes("mp3") && !url.includes("music")
  );
  const audioUrls = processedHrefs.filter((url) =>
    url.endsWith(".mp3") ||
    url.includes("mp3") ||
    url.includes("music")
  );

  videos = videoUrls.slice(0, 2);
  if (audioUrls.length > 0) {
    audio = audioUrls[0];
  }

  // Extract slides/images
  const slide: string[] = [];
  const imgRegex = /<img[^>]*src="([^"]+)"/g;
  while ((m = imgRegex.exec(html))) {
    const imgUrl = m[1];
    if (imgUrl.includes(".jpg") || imgUrl.includes(".png") || imgUrl.includes("photo")) {
      if (imgUrl !== thumbnail) slide.push(imgUrl);
    }
  }

  console.log("=== SSSTIK.IO EXTRACTION DEBUG ===");
  console.log("Processed hrefs:", processedHrefs);
  console.log("Video URLs:", videoUrls);
  console.log("Audio URLs:", audioUrls);
  console.log("Final videos:", videos);
  console.log("Final audio:", audio);
  console.log("Slides:", slide);
  console.log("===================================");

  return { title, creator, thumbnail, videos, audio, musicTitle, musicAuthor, musicDuration, slide, likes: 0, views: 0, comments: 0, shares: 0 };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, quality = 'sd' } = body; // Add quality option: 'sd' or 'hd', default 'sd'

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 })
    }

    let processedUrl = url;
    if (url.includes('/t/') || url.includes('vm.tiktok.com')) {
      processedUrl = await resolveShortUrl(url);
    }

    let result: any;
    try {
      result = await tiktok(processedUrl);
      // Check if media was extracted successfully
      if (result.videos.length === 0 && result.slide.length === 0) {
        throw new Error("No media found from TikSave");
      }
    } catch (err: any) {
      console.error("TikSave failed:", err.message);
      let errorMessage = err.message;
      if (errorMessage.includes("403")) {
        return NextResponse.json({ error: "Access forbidden. The video may be private or restricted." }, { status: 403 });
      } else if (errorMessage.includes("404")) {
        return NextResponse.json({ error: "Video not found or deleted." }, { status: 404 });
      }
      // Fallback to ssstik
      try {
        result = await ssstik(processedUrl);
        if (result.videos.length === 0 && result.slide.length === 0) {
          throw new Error("No media found from ssstik");
        }
      } catch (fallbackErr: any) {
        console.error("ssstik fallback failed:", fallbackErr.message);
        // Second fallback to library with improved logic
        try {
          result = await tryLibraryDownloader(processedUrl);
          if (result.videos.length === 0 && result.slide.length === 0) {
            throw new Error("No media found from library");
          }
        } catch (libraryErr: any) {
          console.error("Library failed:", libraryErr.message);
          // Final fallback to external services like TikWM
          try {
            result = await fallbackToExternalServices(processedUrl);
            if (result.videos.length === 0 && result.slide.length === 0) {
              throw new Error("No media found from external fallbacks");
            }
          } catch (finalErr: any) {
            console.error("All fallbacks failed:", finalErr.message);
            let finalErrorMessage = finalErr.message;
            if (finalErrorMessage.includes("timeout")) {
              return NextResponse.json({ error: "Request timed out. Please try again later." }, { status: 408 });
            } else if (finalErrorMessage.includes("private") || finalErrorMessage.includes("deleted")) {
              return NextResponse.json({ error: "This video appears to be private or deleted." }, { status: 404 });
            }
            return NextResponse.json({ error: `All services failed: ${finalErr.message}` }, { status: 500 });
          }
        }
      }
    }

    const images: string[] = Array.isArray(result.slide) ? result.slide : []
    const isPhoto = images.length > 0
    const videos = result.videos || []
    const audioUrl = result.audio || undefined
    const description = result.title || ""
    const creator = result.creator || ""

    const response: Record<string, any> = {
      type: isPhoto ? "image" : "video",
      images,
      description,
      creator,
      likes: result.likes || 0,
      views: result.views || 0,
      comments: result.comments || 0,
      shares: result.shares || 0,
      musicTitle: result.musicTitle || "",
      musicAuthor: result.musicAuthor || "",
      musicDuration: result.musicDuration || 0
    }
    
    if (!isPhoto) {
      if (videos.length === 0) {
        return NextResponse.json({ error: "No video URLs found" }, { status: 500 })
      }
      
      response.videos = videos
      
      const hdVideo = videos.find((url: string) => 
        url.includes('snapcdn.app') || 
        url.includes('hd') || 
        url.includes('HD')
      ) || (videos.length > 1 ? videos[1] : videos[0]);
      
      response.video = quality === 'hd' ? hdVideo : videos[0];
      response.videoHd = hdVideo;
    }
    if (audioUrl) {
      response.music = audioUrl
    }
    return NextResponse.json(response)
  } catch (err: any) {
    let errorMessage = err?.message || String(err);
    if (errorMessage.includes("403")) {
      return NextResponse.json({ error: "Access forbidden. The video may be private or restricted." }, { status: 403 });
    } else if (errorMessage.includes("404")) {
      return NextResponse.json({ error: "Video not found or deleted." }, { status: 404 });
    } else if (errorMessage.includes("timeout")) {
      return NextResponse.json({ error: "Request timed out. Please try again later." }, { status: 408 });
    }
    return NextResponse.json(
      { error: `Invalid request: ${errorMessage}` },
      { status: 400 },
    )
  }
}
