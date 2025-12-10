import { toast, Toaster } from "solid-toast";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import InputSection from "./ThumbnailInputSection";
import ResultSection from "./ThumbnailResultSection";
import AdBanner from "./AdBanner"; // Adjust path if needed

interface TikTokData {
  status: string | null;
  result: {
    type: string | null;
    author: {
      avatar: string | null;
      nickname: string | null;
    } | null;
    desc: string | null;
    videoSD: string | null;
    videoHD: string | null;
    video_hd: string | null;
    videoWatermark: string | null;
    music: string | null;
    uploadDate?: string | null;
  } | null;
}

type Props = {};

function InputScreen({}: Props) {
  const [url, setUrl] = createSignal("");
  const [data, setData] = createSignal<TikTokData | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [autoProcessing, setAutoProcessing] = createSignal(false);
  const [showModal, setShowModal] = createSignal(false);
  const [pendingDownloadUrl, setPendingDownloadUrl] = createSignal("");
  const [pendingFilename, setPendingFilename] = createSignal("");
  const [modalAdKey, setModalAdKey] = createSignal(0);

  let adContainerRef: HTMLDivElement | undefined;

  // Function to extract TikTok URL from text that might contain promotional content
  const extractTikTokUrl = (text: string): string => {
    // Common TikTok URL patterns - updated to handle query parameters and new formats
    const patterns = [
      // Standard tiktok.com URLs with or without query parameters
      /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/\s]*\/video\/\d+[^\s]*/g,
      // TikTok short URLs with /t/ format
      /https?:\/\/(?:www\.)?tiktok\.com\/t\/[A-Za-z0-9]+[^\s]*/g,
      // vm.tiktok.com with short codes
      /https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+[^\s]*/g,
      // vm.tiktok.com with numeric IDs
      /https?:\/\/vm\.tiktok\.com\/\d+[^\s]*/g,
      // vt.tiktok.com
      /https?:\/\/vt\.tiktok\.com\/[A-Za-z0-9]+[^\s]*/g,
      // Mobile tiktok URLs
      /https?:\/\/m\.tiktok\.com\/v\/\d+\.html[^\s]*/g,
      // Any tiktok.com URL (fallback)
      /https?:\/\/[^\/]*tiktok\.com\/[^\s]*/g
    ];
    console.log("Extracting URL from text:", text);

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match, clean it up
        let url = matches[0];
        // Remove trailing punctuation that might be part of the sentence
        url = url.replace(/[.,!?;]+$/, '');
        console.log("Extracted URL:", url);
        return url;
      }
    }
    // If no pattern matches, check if the text itself is a clean URL
    const cleanText = text.trim();
    if (isValidTikTokUrl(cleanText)) {
      return cleanText;
    }
    return text; // Return original if no URL found
  };

  // Function to validate TikTok URL
  const isValidTikTokUrl = (url: string): boolean => {
    const tikTokPatterns = [
      /tiktok\.com/,
      /douyin/,
      /vm\.tiktok\.com/,
      /vt\.tiktok\.com/,
      /m\.tiktok\.com/
    ];

    return tikTokPatterns.some(pattern => pattern.test(url));
  };

  // Function to suggest URL format fixes
  const suggestUrlFix = (url: string): string => {
    if (url.includes('tiktok') && !url.startsWith('http')) {
      return 'https://' + url;
    }
    return url;
  };

  // Function to clean and format URL for better success rate
  const cleanTikTokUrl = (url: string): string => {
    let cleanUrl = url.trim();

    // First extract the TikTok URL if text contains promotional content
    cleanUrl = extractTikTokUrl(cleanUrl);

    // Remove all query parameters and fragments from desktop/laptop TikTok URLs
    // Handle parameters like: ?is_from_webapp=1&sender_device=pc&web_id=123456
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0];
      console.log("Removed query parameters, clean URL:", cleanUrl);
    }

    // Remove URL fragments (# and everything after)
    if (cleanUrl.includes('#')) {
      cleanUrl = cleanUrl.split('#')[0];
      console.log("Removed fragments, clean URL:", cleanUrl);
    }

    // Ensure we have https protocol
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Remove any trailing slashes that might cause issues
    cleanUrl = cleanUrl.replace(/\/+$/, '');

    console.log("Final cleaned URL:", cleanUrl);
    return cleanUrl;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const tiktokUrl = url().trim();
      console.log("=== FRONTEND DEBUG ===");
      console.log("1. Original URL:", tiktokUrl);

      if (!tiktokUrl) {
        throw new Error("Please enter a TikTok URL");
      }
      if (!isValidTikTokUrl(tiktokUrl)) {
        const suggestedUrl = suggestUrlFix(tiktokUrl);
        if (suggestedUrl !== tiktokUrl) {
          setUrl(suggestedUrl);
          throw new Error(`Invalid TikTok URL. Try: ${suggestedUrl}`);
        } else {
          throw new Error("Please enter a valid TikTok URL (tiktok.com, vm.tiktok.com, etc.)");
        }
      }

      console.log("2. Encoded URL:", encodeURIComponent(tiktokUrl));

      const apiUrl = `/api/tik.json?url=${encodeURIComponent(tiktokUrl)}`;
      console.log("3. Final API URL:", apiUrl);

      let res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("4. Response status:", res.status);
      console.log("5. Response URL:", res.url);

      let json = await res.json();

      console.log("6. FULL API RESPONSE:");
      console.log(JSON.stringify(json, null, 2));

      if (json.debug) {
        console.log("7. DEBUG INFO FROM SERVER:");
        console.log(JSON.stringify(json.debug, null, 2));
      }

      if (!res.ok) {
        // More specific error messages based on status
        if (res.status === 400) {
          throw new Error(json.error || 'Invalid request. Please check your TikTok URL.');
        } else if (res.status === 404) {
          throw new Error('Video not found. The video might have been deleted or is private.');
        } else if (res.status === 500) {
          throw new Error('Server error. Please try again in a moment.');
        } else {
          throw new Error(`HTTP error! status: ${res.status} - ${json.error || 'Unknown error'}`);
        }
      }

      if (json.status === "error" || json.error) {
        throw new Error(json.error || json.message || "Failed to fetch video data");
      }
      if (!json.result) {
        throw new Error("No video data found. The video might be private or restricted.");
      }
      // Check if we have any downloadable content
      const hasVideo = json.result.videoSD || json.result.videoHD || json.result.video_hd || json.result.videoWatermark;
      const hasAudio = json.result.music;

      if (!hasVideo && !hasAudio) {
        throw new Error("No downloadable content found. The video might be protected or unavailable.");
      }
      console.log("DEBUG: About to setData with json.result:", json.result);
      setData(json);
      console.log("DEBUG: setData called successfully");

      setError("");

      toast.success("Video loaded successfully!", {
        duration: 2000,
        position: "bottom-center",
        style: {
          "font-size": "16px",
        },
      });

    } catch (error) {
      console.error("=== FETCH ERROR ===", error);

      let errorMessage = error.message || "An error occurred while fetching data";

      // Provide helpful suggestions based on error type
      if (errorMessage.includes("Invalid TikTok URL")) {
        errorMessage += "\n\nSupported formats:\n• https://www.tiktok.com/@username/video/123456789\n• https://vm.tiktok.com/shortcode/\n• https://m.tiktok.com/v/123456789.html";
      } else if (errorMessage.includes("private") || errorMessage.includes("restricted")) {
        errorMessage += "\n\nTip: Try copying the URL directly from the TikTok app or website.";
      } else if (errorMessage.includes("not found")) {
        errorMessage += "\n\nThe video might have been deleted or the URL is incorrect.";
      }

      toast.error(errorMessage, {
        duration: 5000,
        position: "bottom-center",
        style: {
          "font-size": "16px",
          "max-width": "400px",
          "white-space": "pre-line",
        },
      });

      setData(null);
      setError(error.message);
    }
    setLoading(false);
  };

  const handlePaste = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as any });
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const text = await navigator.clipboard.readText();
        console.log("=== PASTE PROCESSING ===");
        console.log("Pasted raw text:", text);
        console.log("Text length:", text.length);

        // Extract and clean the TikTok URL from the pasted text
        const extractedUrl = extractTikTokUrl(text);
        const cleanedUrl = cleanTikTokUrl(extractedUrl);

        console.log("Extracted URL:", extractedUrl);
        console.log("Cleaned URL:", cleanedUrl);
        console.log("URL length:", cleanedUrl.length);

        setUrl(cleanedUrl);

        // Auto-validate pasted URL and provide feedback
        if (cleanedUrl && isValidTikTokUrl(cleanedUrl)) {
          // Enhanced detection for promotional content
          const isPromotionalContent = (
            text.length > cleanedUrl.length + 15 && // More than just URL + small buffer
            (
              text.toLowerCase().includes('tiktok lite') ||
              text.toLowerCase().includes('download tiktok') ||
              text.toLowerCase().includes('shared via') ||
              text.toLowerCase().includes('this post is') ||
              text.includes('://www.tiktok.com/tiktoklite') ||
              text.split(' ').length > 8 // More than 8 words suggests promotional text
            )
          );

          console.log("Is promotional content:", isPromotionalContent);
          console.log("Content indicators:", {
            lengthDiff: text.length - cleanedUrl.length,
            hasTikTokLite: text.toLowerCase().includes('tiktok lite'),
            hasDownloadTikTok: text.toLowerCase().includes('download tiktok'),
            hasSharedVia: text.toLowerCase().includes('shared via'),
            wordCount: text.split(' ').length
          });

          if (isPromotionalContent) {
            console.log("Auto-processing promotional content...");
            setAutoProcessing(true);

            toast.success("TikTok URL extracted! Starting download automatically...", {
              duration: 2500,
              position: "bottom-center",
              style: {
                "font-size": "14px",
              },
            });

            // Auto-start processing for promotional content
            setTimeout(() => {
              console.log("Executing auto fetchData...");
              fetchData();
            }, 1200); // Slightly longer delay to ensure UI updates

          } else {
            console.log("Direct URL pasted, no auto-processing");
            toast.success("Valid TikTok URL pasted! Click Download to process.", {
              duration: 1500,
              position: "bottom-center",
            });
          }
        } else if (text && text.includes('tiktok')) {
          toast.error("Could not extract a valid TikTok URL from the pasted content.", {
            duration: 2500,
            position: "bottom-center",
          });
        }
      }
    } catch (err) {
      console.error("Paste error:", err);
      toast.error("Clipboard access denied");
    }
  };

  // Function to cancel auto-processing
  const cancelAutoProcessing = () => {
    setAutoProcessing(false);
    toast.info("Auto-processing cancelled", {
      duration: 1000,
      position: "bottom-center",
    });
  };

  // Function to handle download button click
  const handleDownloadClick = (downloadUrl: string, filename: string) => {
    setPendingDownloadUrl(downloadUrl);
    setPendingFilename(filename);
    setShowModal(true);
    document.body.classList.add('mx-modal-open');
    
    // Force ad to reload by changing the key
    setModalAdKey(prev => prev + 1);
  };

  // Function to close modal and start download
  const closeModalAndDownload = () => {
    const url = pendingDownloadUrl();
    const filename = pendingFilename();

    console.log("=== CLOSE AND DOWNLOAD ===");
    console.log("URL:", url);
    console.log("Filename:", filename);

    // Close modal first
    setShowModal(false);
    document.body.classList.remove('mx-modal-open');

    // Start the download if URL exists
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      toast.success("Download started!", {
        duration: 2000,
        position: "bottom-center",
      });
    } else {
      console.error("No download URL found!");
      toast.error("Download failed - no URL found", {
        duration: 2000,
        position: "bottom-center",
      });
    }

    // Clear pending download
    setPendingDownloadUrl("");
    setPendingFilename("");
  };

  // Load ad script when component mounts (for main ad section after form)
  onMount(() => {
    console.log("onMount: adContainerRef is", adContainerRef);
    if (adContainerRef) {
      const script = document.createElement('script');
      script.setAttribute('data-cfasync', 'false');
      script.async = true;
      script.type = 'text/javascript';
      script.src = '//qh.misweenownself.com/tCciuVIqr69/105741';
      adContainerRef.appendChild(script);
      console.log("Ad script loaded into main container");
    } else {
      console.warn("adContainerRef not set—ad won't load");
    }
  });

  onCleanup(() => {
    document.body.classList.remove('mx-modal-open');
  });

  const getVideoUrl = () => {
    const result = data()?.result;
    return result?.videoSD || result?.videoHD || result?.video_hd || result?.videoWatermark || result?.music || "";
  };

  const getAuthorInfo = () => {
    const author = data()?.result?.author;
    return {
      avatar: author?.avatar || "",
      nickname: author?.nickname || "Unknown Author"
    };
  };

  // Helper to get safe filename for downloads
  const getSafeFilename = () => {
    const author = getAuthorInfo().nickname;
    return author.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  };

  // Handle form submission
  const handleSubmit = (e: Event) => {
    e.preventDefault();

    // Don't start manual processing if auto-processing is happening
    if (autoProcessing()) {
      toast.info("Auto-processing in progress...", {
        duration: 1000,
        position: "bottom-center",
      });
      return;
    }

    const currentUrl = url().trim();
    console.log("=== FORM SUBMISSION ===");
    console.log("Form submission - URL value:", currentUrl);

    // Auto-extract URL if the input contains promotional text
    if (currentUrl && currentUrl.length > 100 && currentUrl.includes('tiktok')) {
      const extractedUrl = extractTikTokUrl(currentUrl);
      if (extractedUrl !== currentUrl) {
        setUrl(extractedUrl);
        toast.info("Extracted TikTok URL from shared content", {
          duration: 1500,
          position: "bottom-center",
        });
        // Small delay to let user see the extraction
        setTimeout(() => fetchData(), 500);
        return;
      }
    }

    fetchData();
  };

  console.log("DEBUG: InputScreen rendering with data:", data());

  return (
    <div class="max-w-6xl mx-auto mt-8 px-4">
      <Toaster />

      {/* Add modal styles */}
      <style>{`
        .mx-modal-open {
          overflow: hidden;
        }
        .mx-modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0, 0, 0, .4);
          align-items: center;
          justify-content: center;
        }
        .mx-modal.show {
          display: flex;
        }
        .mx-modal-content {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          pointer-events: auto;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid rgba(0, 0, 0, .175);
          border-radius: .5rem;
          outline: 0;
          -webkit-animation-name: mx-animatetop;
          -webkit-animation-duration: .4s;
          animation-name: mx-animatetop;
          animation-duration: .4s;
        }
        @-webkit-keyframes mx-animatetop {
          from {
            top: -300px;
            opacity: 0;
          }
          to {
            top: 0;
            opacity: 1;
          }
        }
        @keyframes mx-animatetop {
          from {
            top: -300px;
            opacity: 0;
          }
          to {
            top: 0;
            opacity: 1;
          }
        }
        .mx-modal-header {
          padding: 10px 15px;
          display: flex;
          justify-content: flex-end;
        }
        .mx-modal-body {
          padding: 2px 15px;
          min-height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .mx-modal-content {
            max-width: 1140px;
          }
        }
        #closeModalBtn {
          color: #fff;
          background-color: #6c757d;
          border: 1px solid #6c757d;
          display: block;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
        }
        #closeModalBtn:hover {
          background-color: #5a6268;
        }
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

      {/* Advertisement Section after form - Only show when NO data */}
      <Show when={!data()}>
        <div class="my-8 w-full flex justify-center">
          <div
            ref={(el) => adContainerRef = el}
            class="ad-container w-full min-h-[250px]"
          ></div>
        </div>
      </Show>

      <Show when={!!data() && !!data()?.result}>
        <ResultSection
          data={data()}
          getVideoUrl={getVideoUrl}
          getAuthorInfo={getAuthorInfo}
          getSafeFilename={getSafeFilename}
          onDownloadClick={handleDownloadClick}
        />
      </Show>

      {/* Download Modal with Advertisement */}
      <div
        id="dlModal"
        class={`mx-modal ${showModal() ? 'show' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModalAndDownload();
          }
        }}
      >
        <div class="mx-modal-content">
          
          <div class="mx-modal-body" id="ad-content">
            <Show when={showModal()}>
              <AdBanner 
                key={modalAdKey()}
                class="mx-auto" 
                width="336px" 
                height="280px"
                forceReload={true}
              />
            </Show>
          </div>
		  <div class="mx-modal-header">
            <button
              id="closeModalBtn"
              onClick={closeModalAndDownload}
            >
              Close & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InputScreen;