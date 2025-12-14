// src/pages/api/tik.json.ts
import type { APIRoute } from "astro";

export const prerender = false;

import TikTok from "@tobyg74/tiktok-api-dl";

async function resolveShortUrl(url: string): Promise<string> {
  try {
    console.log("Resolving short URL:", url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const resolvedUrl = response.url;
    console.log("Resolved to:", resolvedUrl);
    return resolvedUrl;
  } catch (error: any) {
    console.log("URL resolution failed:", error.message);
    return url;
  }
}

// Helper function to safely extract stats from multiple possible paths
function extractStats(result: any) {
  console.log("=== EXTRACTING STATS ===");
  console.log("Full result object keys:", Object.keys(result));
  
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

  console.log("=== TRANSFORMING LIBRARY RESPONSE ===");

  const thumbnail = result.cover?.[0] 
    || result.originCover?.[0] 
    || result.video?.cover?.[0] 
    || result.video?.originCover?.[0]
    || result.dynamicCover?.[0] 
    || result.video?.dynamicCover?.[0]
    || null;

  const stats = extractStats(result);

  // Reject response if views are suspiciously low
  if (stats.views === 0 || stats.views < 100) {
    console.log("⚠️ Library returned suspiciously low views. Throwing to trigger fallback.");
    throw new Error("Invalid views count from library");
  }

  return {
    status: "success",
    result: {
      type: result.type || (result.images ? "image" : "video"),
      author: {
        avatar: result.author?.avatarThumb?.[0] || result.author?.avatarLarger || result.author?.avatar || null,
        nickname: result.author?.nickname || result.author?.username || result.author?.uniqueId || "Unknown Author"
      },
      desc: result.desc || result.title || "No description available",
      videoSD: result.video?.downloadAddr?.[0] || result.video?.playAddr?.[0] || null,
      videoHD: result.video?.downloadAddr?.[1] || result.video?.downloadAddr?.[0] || result.video?.playAddr?.[1] || result.video?.playAddr?.[0] || null,
      video_hd: result.video?.downloadAddr?.[0] || result.video?.playAddr?.[0] || null,
      videoWatermark: result.video?.playAddr?.[0] || result.video?.wmplay || null,
      music: result.music?.playUrl?.[0] || result.music?.play || null,
      uploadDate: result.createTime ? new Date(result.createTime * 1000).toISOString() : null,
      images: result.images || null,
      thumbnail: thumbnail,
      likes: stats.likes,
      views: stats.views,
      comments: stats.comments,
      shares: stats.shares
    }
  };
}

async function tryLibraryDownloader(url: string) {
  const versions = ["v3", "v2", "v1"];
  let lastError = null;

  for (const version of versions) {
    try {
      console.log(`\n=== Trying TikTok library version ${version} ===`);
      
      const result = await TikTok.Downloader(url, {
        version: version,
        showOriginalResponse: false
      });

      console.log(`Raw ${version} response status:`, result.status);
      
      if (result.status === "success" && result.result) {
        const transformedData = transformLibraryResponse(result);
        if (transformedData && transformedData.result) {
          console.log(`✅ Success with library version ${version}`);
          return transformedData;
        }
      }
      
      throw new Error(result.message || `Library version ${version} returned no valid data`);
      
    } catch (error: any) {
      console.log(`❌ Library version ${version} failed:`, error.message);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw lastError || new Error("All library downloader versions failed");
}

async function fallbackToExternalServices(url: string) {
  const services = [
    {
      name: 'TikWM',
      url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url.trim())}`,
      transform: (data: any) => {
        console.log("=== TIKWM FULL RESPONSE ===");
        console.log(JSON.stringify(data, null, 2));
        
        const likes = data.data?.digg_count || 0;
        const views = data.data?.play_count || 0;
        const comments = data.data?.comment_count || 0;
        const shares = data.data?.share_count || 0;
        
        console.log("TikWM extracted stats:", { likes, views, comments, shares });
        
        return {
          status: "success",
          result: {
            type: data.data?.images ? "image" : "video",
            author: {
              avatar: data.data?.author?.avatar || null,
              nickname: data.data?.author?.unique_id || data.data?.author?.nickname || "Unknown Author"
            },
            desc: data.data?.title || "No description available",
            videoSD: data.data?.play || null,
            videoHD: data.data?.hdplay || data.data?.play || null,
            video_hd: data.data?.hdplay || null,
            videoWatermark: data.data?.wmplay || null,
            music: data.data?.music || null,
            uploadDate: data.data?.create_time ? new Date(data.data.create_time * 1000).toISOString() : null,
            images: data.data?.images || null,
            thumbnail: data.data?.cover || data.data?.origin_cover || data.data?.dynamic_cover || null,
            likes: likes,
            views: views,
            comments: comments,
            shares: shares
          }
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
        signal: AbortSignal.timeout(10000)
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

  throw new Error("All fallback services failed");
}

export const GET: APIRoute = async ({ request, url: requestUrl }) => {
  // Add CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  try {
    console.log("\n" + "=".repeat(50));
    console.log("=== NEW TIKTOK API REQUEST ===");
    console.log("=".repeat(50));
    console.log("Request URL:", requestUrl.href);
    console.log("Request method:", request.method);
    
    const url = requestUrl.searchParams.get("url");
    console.log("URL parameter:", url);
    
    if (!url) {
      return new Response(JSON.stringify({
        error: "URL parameter is required",
        status: "error"
      }), {
        status: 400,
        headers
      });
    }
    
    if (!url.includes("tiktok.com") && !url.includes("douyin")) {
      return new Response(JSON.stringify({
        error: "Invalid URL. Please provide a valid TikTok URL.",
        status: "error"
      }), {
        status: 400,
        headers
      });
    }
    
    let processedUrl = url;
    if (url.includes('/t/') || url.includes('vm.tiktok.com')) {
      processedUrl = await resolveShortUrl(url);
    }
    
    console.log("Processing URL:", processedUrl);

    let data;
    try {
      data = await tryLibraryDownloader(processedUrl);
    } catch (libraryError: any) {
      console.log("\n⚠️ Library failed, trying fallback services...");
      console.log("Library error:", libraryError.message);
      
      try {
        data = await fallbackToExternalServices(processedUrl);
      } catch (fallbackError: any) {
        console.log("❌ All services failed");
        throw new Error("Both library and fallback services failed to return valid data");
      }
    }
    
    if (!data || !data.result) {
      throw new Error("No data returned from any service");
    }
    
    const hasVideo = data.result.videoSD || data.result.videoHD || data.result.video_hd || data.result.videoWatermark;
    const hasAudio = data.result.music;
    const hasImages = data.result.images;
    
    if (!hasVideo && !hasAudio && !hasImages) {
      return new Response(JSON.stringify({
        error: "This video appears to be private, deleted, or not available for download.",
        status: "error"
      }), {
        status: 404,
        headers
      });
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("=== FINAL RESPONSE DATA ===");
    console.log("Stats being returned:", {
      likes: data.result.likes,
      views: data.result.views,
      comments: data.result.comments,
      shares: data.result.shares
    });
    console.log("=".repeat(50) + "\n");
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    console.error("\n" + "=".repeat(50));
    console.error("=== FINAL ERROR ===");
    console.error("Error:", error.message || error);
    console.error("Stack:", error.stack);
    console.error("=".repeat(50) + "\n");
    
    let errorMessage = "Unable to fetch TikTok video data.";
    let statusCode = 500;
    
    if (error.message?.includes("403")) {
      errorMessage = "TikTok is blocking requests. Try again later.";
      statusCode = 403;
    } else if (error.message?.includes("404") || error.message?.includes("private") || error.message?.includes("deleted")) {
      errorMessage = "Video not found or is private.";
      statusCode = 404;
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Request timed out. Service may be busy.";
      statusCode = 408;
    }
    
    return new Response(JSON.stringify({
      error: errorMessage,
      status: "error",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers
    });
  }
};

// Add POST handler for compatibility
export const POST: APIRoute = GET;
