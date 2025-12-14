import { NextResponse } from "next/server"

const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\//

// Helper: Fetch with timeout (8.5s to stay safe under Vercel 10s limit)
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8500) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error: any) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    console.log("Resolving short URL:", url)
    const response = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
    })
    console.log("Resolved to:", response.url)
    return response.url
  } catch (error) {
    console.error("URL resolution failed:", error)
    return url
  }
}

// === PRIMARY: ssstik.io ===
async function ssstik(url: string) {
  if (!tiktokRegex.test(url)) throw new Error("Invalid URL")

  const userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"

  // Get tt token
  const homeRes = await fetchWithTimeout("https://ssstik.io", { headers: { "user-agent": userAgent } })
  if (!homeRes.ok) throw new Error(`Failed to load ssstik: ${homeRes.status}`)
  const homeHtml = await homeRes.text()
  const ttMatch = /tt:'([\w\d]+)'/.exec(homeHtml)
  if (!ttMatch) throw new Error("Failed to extract tt token")

  const tt = ttMatch[1]
  const form = new URLSearchParams({ id: url, locale: "en", tt })

  const res = await fetchWithTimeout("https://ssstik.io/abc?url=dl", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent,
      origin: "https://ssstik.io",
      referer: "https://ssstik.io/",
    },
    body: form.toString(),
  })

  if (!res.ok) throw new Error(`ssstik failed: ${res.status}`)
  const html = await res.text()

  // Parse description
  let title = ""
  const descPatterns = [
    /<h2[^>]*class=["']?tiktitle[^>]*>([\s\S]*?)<\/h2>/i,
    /<p[^>]*class=["']?description[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*class=["']?result-overlay[^>]*>([\s\S]*?)<\/div>/i,
  ]
  for (const pat of descPatterns) {
    const m = pat.exec(html)
    if (m && m[1]) {
      title = m[1].replace(/<[^>]+>/g, "").trim()
      if (title) break
    }
  }

  // Creator
  let creator = ""
  const creatorMatch = html.match(/@([a-zA-Z0-9_.]{1,24})/)
  if (creatorMatch) creator = creatorMatch[1]

  // Thumbnail
  let thumbnail = ""
  const thumbMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*class=["']?pure-img/)
  || html.match(/<img[^>]+src=["']([^"']+)["']/)
  if (thumbMatch) thumbnail = thumbMatch[1]

  // Stats (likes, views, comments, shares)
  let likes = 0, views = 0, comments = 0, shares = 0
  const statsText = html.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{3})*)\s*(?:Likes|Views|Comments|Shares)/g) || []
  const statLabels = html.match(/(Likes|Views|Comments|Shares)/g) || []
  statsText.forEach((numStr: string, i: number) => {
    const num = parseInt(numStr.replace(/[.,]/g, ""), 10)
    const label = statLabels[i]
    if (label === "Likes") likes = num
    else if (label === "Views") views = num
    else if (label === "Comments") comments = num
    else if (label === "Shares") shares = num
  })

  // Music info
  let musicTitle = "", musicAuthor = ""
  const musicMatch = html.match(/<p[^>]*class=["']?music[^>]*>([\s\S]*?)<\/p>/i)
  if (musicMatch) {
    const musicText = musicMatch[1].replace(/<[^>]+>/g, "").trim()
    const parts = musicText.split(" - ")
    if (parts.length >= 2) {
      musicTitle = parts[1].trim()
      musicAuthor = parts[0].trim()
    } else {
      musicTitle = musicText
    }
  }

  // Links
  const hrefs: string[] = []
  const hrefRegex = /href="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = hrefRegex.exec(html))) hrefs.push(m[1])

  const processed = hrefs.map(h => {
    if (h.includes("ssscdn") || h.includes("tikcdn")) {
      try {
        const parts = h.split("/")
        if (parts.length > 5) return atob(parts.slice(5).join("/"))
      } catch {}
    }
    return h
  })

  const videoUrls = processed.filter(u => u.endsWith(".mp4") || (u.includes("video") && !u.includes("music")))
  const audioUrls = processed.filter(u => u.endsWith(".mp3") || u.includes("music") || u.includes("audio"))
  const videos = videoUrls.slice(0, 2)
  const audio = audioUrls[0] || ""

  // Slides (photos)
  const slide: string[] = []
  const imgRegex = /<img[^>]+src="([^"]+)"/g
  while ((m = imgRegex.exec(html))) {
    const src = m[1]
    if ((src.includes(".jpg") || src.includes(".jpeg") || src.includes("photo")) && src !== thumbnail) {
      slide.push(src)
    }
  }

  console.log("✅ ssstik success", { title: title.substring(0,50), creator, videos: videos.length, slide: slide.length, stats: {likes, views} })

  return {
    title, creator, thumbnail, videos, audio,
    musicTitle, musicAuthor, musicDuration: 0,
    slide, likes, views, comments, shares
  }
}

// === SECONDARY: TikSave.io ===
async function tiksave(url: string) {
  if (!tiktokRegex.test(url)) throw new Error("Invalid URL")

  const form = new URLSearchParams({ q: url, lang: "en" })

  const res = await fetchWithTimeout("https://tiksave.io/api/ajaxSearch", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      origin: "https://tiksave.io",
      referer: "https://tiksave.io/",
    },
    body: form.toString(),
  })

  if (!res.ok) throw new Error(`TikSave HTTP ${res.status}`)
  const json: any = await res.json()
  const html = json?.data || json?.data?.data
  if (typeof html !== "string") throw new Error("Invalid TikSave response")

  // Title & Creator
  let title = "", creator = ""
  const titlePatterns = [
    /class=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
    /class=["']desc["'][^>]*>([\s\S]*?)<\/div>/i,
    /class=["']description["'][^>]*>([\s\S]*?)<\/div>/i,
  ]
  for (const pat of titlePatterns) {
    const m = pat.exec(html)
    if (m && m[1]) {
      title = m[1].replace(/<[^>]+>/g, "").trim()
      if (title) break
    }
  }
  const creatorMatch = html.match(/@([a-zA-Z0-9_.]{1,24})/)
  if (creatorMatch) creator = creatorMatch[1]

  // Thumbnail
  let thumbnail = ""
  const thumbMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class=["']tik-left/)
  if (thumbMatch) thumbnail = thumbMatch[1]

  // Stats (basic attempt)
  let likes = 0, views = 0, comments = 0, shares = 0
  const statMatches = html.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{3})*)\s*(Likes|Views|Comments|Shares)/g)
  if (statMatches) {
    statMatches.forEach(str => {
      const num = parseInt(str.replace(/[.,\s]/g, ""), 10)
      if (str.includes("Likes")) likes = num
      else if (str.includes("Views")) views = num
      else if (str.includes("Comments")) comments = num
      else if (str.includes("Shares")) shares = num
    })
  }

  // Links
  let videos: string[] = [], audio = ""
  const allHrefs: string[] = []
  const hrefRegex = /href="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = hrefRegex.exec(html))) allHrefs.push(m[1])

  const videoUrls = allHrefs.filter(u => u.includes(".mp4") || (u.includes("video") && !u.includes("audio")))
  const audioUrls = allHrefs.filter(u => u.includes(".mp3") || u.includes("audio"))
  videos = videoUrls.slice(0, 2)
  audio = audioUrls[0] || ""

  // Slides
  const slide: string[] = []
  const ulMatch = /<ul[^>]+class=["'][^"']*download-box[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html)
  if (ulMatch) {
    const imgRegex = /src="([^"]+)"/g
    while ((m = imgRegex.exec(ulMatch[1]))) slide.push(m[1])
  }

  return { title, creator, thumbnail, videos, audio, musicTitle: "", musicAuthor: "", musicDuration: 0, slide, likes, views, comments, shares }
}

// === Library & TikWM fallbacks remain mostly unchanged but with timeout ===
async function tryLibraryDownloader(url: string) {
  const Tiktok = require('@tobyg74/tiktok-api-dl')
  const versions = ["v3", "v2", "v1"]
  let lastError

  for (const v of versions) {
    try {
      const result = await Tiktok.Downloader(url, { version: v, timeout: 8000 }) // library supports timeout
      if (result.status === "success" && result.result) {
        const data = transformLibraryResponse(result)
        if (data && data.views >= 1000) return data
      }
    } catch (e: any) {
      lastError = e
    }
  }
  throw lastError || new Error("Library failed")
}

function transformLibraryResponse(libraryData: any) {
  // ... (keep your existing robust transformLibraryResponse and extractStats)
  // unchanged for brevity — it's already excellent
}

async function fallbackToTikWM(url: string) {
  const res = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error("TikWM failed")
  const data = await res.json()
  if (data.code !== 0 || !data.data) throw new Error("TikWM invalid response")
  // ... (your existing transform)
}

// === MAIN POST HANDLER ===
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, quality = 'sd' } = body

    if (!url || typeof url !== "string" || !tiktokRegex.test(url)) {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 })
    }

    let processedUrl = url
    if (url.includes('/t/') || url.includes('vm.tiktok.com')) {
      processedUrl = await resolveShortUrl(url)
    }

    let result: any

    // 1. Primary: ssstik
    try {
      result = await ssstik(processedUrl)
      if (result.videos.length === 0 && result.slide.length === 0) throw new Error("No media")
    } catch (e) {
      console.log("ssstik failed, trying TikSave...")
      // 2. TikSave
      try {
        result = await tiksave(processedUrl)
        if (result.videos.length === 0 && result.slide.length === 0) throw new Error("No media")
      } catch (e) {
        console.log("TikSave failed, trying library...")
        // 3. Library
        try {
          result = await tryLibraryDownloader(processedUrl)
        } catch (e) {
          console.log("Library failed, trying TikWM...")
          // 4. TikWM
          result = await fallbackToTikWM(processedUrl)
        }
      }
    }

    const isPhoto = result.slide.length > 0
    const videos = result.videos || []
    const hdVideo = videos.find((v: string) => v.includes('hd') || v.includes('HD') || v.includes('snapcdn')) || videos[1] || videos[0]

    const response: any = {
      type: isPhoto ? "image" : "video",
      images: isPhoto ? result.slide : [],
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
    }

    if (!isPhoto) {
      response.videos = videos
      response.video = quality === 'hd' ? hdVideo : videos[0]
      response.videoHd = hdVideo
    }

    if (result.audio) response.music = result.audio

    return NextResponse.json(response)

  } catch (err: any) {
    console.error("All methods failed:", err.message)
    if (err.message.includes("timeout")) return NextResponse.json({ error: "Request timed out" }, { status: 408 })
    if (err.message.includes("private") || err.message.includes("deleted")) return NextResponse.json({ error: "Video is private or deleted" }, { status: 404 })
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}
