// src/components/InputScreen.tsx
import { toast, Toaster } from "solid-toast";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import InputSection from "./InputSection";
import ResultSection from "./ResultSection";
import AdBanner from "./AdBanner";

type TikTokResponse = {
  type: "video" | "image";
  description: string;
  creator: string;
  thumbnail: string;
  video?: string;
  videoHd?: string;
  videos?: string[];
  music?: string;
  musicTitle?: string;
  musicAuthor?: string;
  musicDuration?: number;
  images?: string[];
  likes: number;
  views: number;
  comments: number;
  shares: number;
};

function InputScreen() {
  const [url, setUrl] = createSignal("");
  const [data, setData] = createSignal<TikTokResponse | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [autoProcessing, setAutoProcessing] = createSignal(false);
  const [showModal, setShowModal] = createSignal(false);
  const [pendingDownloadUrl, setPendingDownloadUrl] = createSignal("");
  const [pendingFilename, setPendingFilename] = createSignal("");
  const [modalAdKey, setModalAdKey] = createSignal(0);

  let adContainerRef: HTMLDivElement | undefined;

  const extractTikTokUrl = (text: string): string => {
    const patterns = [
      /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/\s]*\/video\/\d+[^\s]*/g,
      /https?:\/\/(?:www\.)?tiktok\.com\/t\/[A-Za-z0-9]+[^\s]*/g,
      /https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+[^\s]*/g,
      /https?:\/\/vm\.tiktok\.com\/\d+[^\s]*/g,
      /https?:\/\/vt\.tiktok\.com\/[A-Za-z0-9]+[^\s]*/g,
      /https?:\/\/m\.tiktok\.com\/v\/\d+\.html[^\s]*/g,
      /https?:\/\/[^\/]*tiktok\.com\/[^\s]*/g,
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches?.length) {
        let url = matches[0].replace(/[.,!?;]+$/, '');
        return url;
      }
    }

    const cleanText = text.trim();
    if (isValidTikTokUrl(cleanText)) return cleanText;
    return text;
  };

  const isValidTikTokUrl = (url: string): boolean => {
    return /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com/.test(url);
  };

  const suggestUrlFix = (url: string): string => {
    if (url.includes('tiktok') && !url.startsWith('http')) return 'https://' + url;
    return url;
  };

  const cleanTikTokUrl = (url: string): string => {
    let clean = extractTikTokUrl(url.trim());

    if (clean.includes('?')) clean = clean.split('?')[0];
    if (clean.includes('#')) clean = clean.split('#')[0];
    if (!clean.startsWith('http')) clean = 'https://' + clean;
    clean = clean.replace(/\/+$/, '');

    return clean;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setAutoProcessing(false);

    try {
      let tiktokUrl = url().trim();

      if (!tiktokUrl) throw new Error("Please enter a TikTok URL");

      if (!isValidTikTokUrl(tiktokUrl)) {
        const suggested = suggestUrlFix(tiktokUrl);
        if (suggested !== tiktokUrl) {
          setUrl(suggested);
          throw new Error(`Invalid URL. Did you mean: ${suggested}`);
        }
        throw new Error("Please enter a valid TikTok URL");
      }

      // Fixed: Use POST with JSON body (matches tik.json.ts POST handler)
      const res = await fetch('/api/tik.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tiktokUrl, quality: 'hd' }), // 'hd' preferred
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 400) throw new Error(json.error || "Invalid URL");
        if (res.status === 404) throw new Error("Video not found or private");
        if (res.status === 408) throw new Error("Request timed out – try again");
        throw new Error(json.error || `Server error (${res.status})`);
      }

      if (json.error) throw new Error(json.error);

      const hasVideo = json.video || json.videoHd || json.videos?.length;
      const hasAudio = json.music;
      const hasImages = json.type === "image" && json.images?.length;

      if (!hasVideo && !hasAudio && !hasImages) {
        throw new Error("No downloadable content (video may be restricted)");
      }

      setData(json);
      toast.success("Video loaded successfully!", { duration: 2000, position: "bottom-center" });

    } catch (err: any) {
      console.error("Fetch error:", err);
      const msg = err.message || "Unknown error occurred";
      toast.error(msg, {
        duration: 5000,
        position: "bottom-center",
        style: { "white-space": "pre-line", "font-size": "16px" },
      });
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const extracted = extractTikTokUrl(text);
      const cleaned = cleanTikTokUrl(extracted);

      setUrl(cleaned);

      if (isValidTikTokUrl(cleaned)) {
        const isPromotional = text.length > cleaned.length + 15 &&
          (text.toLowerCase().includes('tiktok lite') ||
           text.toLowerCase().includes('shared via') ||
           text.split(' ').length > 8);

        if (isPromotional) {
          setAutoProcessing(true);
          toast.success("URL extracted! Processing automatically...", { duration: 2500 });
          setTimeout(fetchData, 1200);
        } else {
          toast.success("Valid URL pasted! Click Download to continue.", { duration: 1500 });
        }
      } else {
        toast.error("No valid TikTok URL found in clipboard");
      }
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const cancelAutoProcessing = () => {
    setAutoProcessing(false);
    toast.info("Auto-processing cancelled", { duration: 1000 });
  };

  const handleDownloadClick = (downloadUrl: string, filename: string) => {
    setPendingDownloadUrl(downloadUrl);
    setPendingFilename(filename);
    setShowModal(true);
    document.body.classList.add('mx-modal-open');
    setModalAdKey(prev => prev + 1);
  };

  const closeModalAndDownload = () => {
    const url = pendingDownloadUrl();
    const filename = pendingFilename();

    setShowModal(false);
    document.body.classList.remove('mx-modal-open');

    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
      toast.success("Download started!", { duration: 2000 });
    } else {
      toast.error("Download failed – no URL");
    }

    setPendingDownloadUrl("");
    setPendingFilename("");
  };

  onMount(() => {
    if (adContainerRef) {
      const script = document.createElement('script');
      script.async = true;
      script.src = '//qh.misweenownself.com/tCciuVIqr69/105741';
      adContainerRef.appendChild(script);
    }
  });

  onCleanup(() => document.body.classList.remove('mx-modal-open'));

  const getVideoUrl = () => {
    const d = data();
    if (!d) return "";
    return d.videoHd || d.video || d.videos?.[0] || "";
  };

  const getAuthorInfo = () => {
    const d = data();
    return {
      avatar: d?.thumbnail || "",
      nickname: d?.creator || "Unknown Creator"
    };
  };

  const getSafeFilename = () => {
    const d = data();
    const creator = (d?.creator || "tiktok").replace('@', '');
    return creator.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (autoProcessing()) return;
    fetchData();
  };

  return (
    <div class="max-w-6xl mx-auto mt-8 px-4">
      <Toaster />

      <style>{`
        .mx-modal-open { overflow: hidden; }
        .mx-modal { display: none; position: fixed; z-index: 1000; inset: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; }
        .mx-modal.show { display: flex; }
        .mx-modal-content { max-width: 1140px; width: 100%; background: white; border-radius: .5rem; animation: mx-animatetop .4s; }
        @keyframes mx-animatetop { from { top: -300px; opacity: 0 } to { top: 0; opacity: 1 } }
        .mx-modal-header { padding: 10px 15px; display: flex; justify-content: flex-end; }
        .mx-modal-body { padding: 15px; min-height: 250px; display: flex; align-items: center; justify-content: center; }
        #closeModalBtn { background: #6c757d; color: white; border: 1px solid #6c757d; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        #closeModalBtn:hover { background: #5a6268; }
      `}</style>

      <Show when={!data()}>
        <InputSection
          url={url()}
          setUrl={setUrl}
          loading={loading()}
          autoProcessing={autoProcessing()}
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          onCancelAutoProcessing={cancelAutoProcessing}
          error={error()}
          extractTikTokUrl={extractTikTokUrl}
          cleanTikTokUrl={cleanTikTokUrl}
          isValidTikTokUrl={isValidTikTokUrl}
        />
      </Show>

      <Show when={!data()}>
        <div class="my-8 w-full flex justify-center">
          <div ref={adContainerRef} class="ad-container w-full min-h-[250px]"></div>
        </div>
      </Show>

      <Show when={data()}>
        <ResultSection
          data={data()}
          getVideoUrl={getVideoUrl}
          getAuthorInfo={getAuthorInfo}
          getSafeFilename={getSafeFilename}
          onDownloadClick={handleDownloadClick}
        />
      </Show>

      <div class={`mx-modal ${showModal() ? 'show' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModalAndDownload()}>
        <div class="mx-modal-content">
          <div class="mx-modal-body">
            <Show when={showModal()}>
              <AdBanner key={modalAdKey()} class="mx-auto" width="336px" height="280px" forceReload={true} />
            </Show>
          </div>
          <div class="mx-modal-header">
            <button id="closeModalBtn" onClick={closeModalAndDownload}>
              Close & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InputScreen;
