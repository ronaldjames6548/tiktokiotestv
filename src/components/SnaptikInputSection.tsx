// src/components/InputSection.tsx
import { toast } from "solid-toast";

interface InputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  autoProcessing: boolean;
  onSubmit: (e: Event) => void;
  onPaste: () => void;
  onCancelAutoProcessing: () => void;
  error: string;
  extractTikTokUrl: (text: string) => string;
  cleanTikTokUrl: (url: string) => string;
  isValidTikTokUrl: (url: string) => boolean;
}

function InputSection(props: InputSectionProps) {
  const handleInputChange = (e: Event) => {
    const newUrl = (e.target as HTMLInputElement).value;
    console.log("Input changed:", newUrl);
    props.setUrl(newUrl);
    
    // Clear previous error when user starts typing
    // Note: Error handling is in parent, but we can clear here if needed
    // setError(""); // Moved to parent if centralized

    // Auto-detect and process promotional content when typing/pasting into input
    if (newUrl && newUrl.length > 50 && newUrl.includes('tiktok')) {
      const extractedUrl = props.extractTikTokUrl(newUrl);
      const cleanedUrl = props.cleanTikTokUrl(extractedUrl);
      
      // Check if this looks like promotional content
      const isPromotionalContent = (
        newUrl.length > cleanedUrl.length + 15 &&
        (
          newUrl.toLowerCase().includes('tiktok lite') ||
          newUrl.toLowerCase().includes('download tiktok') ||
          newUrl.toLowerCase().includes('shared via') ||
          newUrl.toLowerCase().includes('this post is') ||
          newUrl.includes('://www.tiktok.com/tiktoklite') ||
          newUrl.split(' ').length > 8
        )
      );

      if (isPromotionalContent && cleanedUrl !== newUrl) {
        console.log("Auto-processing detected in input field");
        props.setUrl(cleanedUrl);
        // Trigger auto-processing via parent state
        // Note: setAutoProcessing(true) is in parent, but we can emit event or call callback
        // For now, assuming parent handles via onSubmit or separate callback
      }
    }
  };

  const handlePasteInInput = (e: Event) => {
    // Handle paste event directly in the input field
    setTimeout(() => {
      const pastedText = (e.target as HTMLInputElement).value;
      console.log("Direct paste in input:", pastedText);
      
      if (pastedText && pastedText.length > 50) {
        const extractedUrl = props.extractTikTokUrl(pastedText);
        const cleanedUrl = props.cleanTikTokUrl(extractedUrl);
        
        const isPromotionalContent = (
          pastedText.length > cleanedUrl.length + 15 &&
          (
            pastedText.toLowerCase().includes('tiktok lite') ||
            pastedText.toLowerCase().includes('download tiktok') ||
            pastedText.toLowerCase().includes('shared via') ||
            pastedText.toLowerCase().includes('this post is') ||
            pastedText.includes('://www.tiktok.com/tiktoklite') ||
            pastedText.split(' ').length > 8
          )
        );

        if (isPromotionalContent && cleanedUrl !== pastedText) {
          console.log("Auto-processing pasted promotional content");
          props.setUrl(cleanedUrl);
          // Trigger auto-processing via parent
        }
      }
    }, 100); // Small delay to let paste complete
  };

  return (
    <div class="max-w-6xl mx-auto">
      <div class="download-box rounded-2xl">
        <div class="rounded p-1">
          <form class="flex flex-col md:flex-row items-stretch md:items-center gap-2"
            onSubmit={props.onSubmit}
          >
            <div class="relative flex-grow rounded bg-white">
              <input type="text"
                value={props.url}
                onInput={handleInputChange}
                onPaste={handlePasteInInput}
                placeholder="Paste TikTok video link or shared content here (we'll extract the URL automatically)"
                class="w-full h-14 border-gray-700 text-black rounded-xl px-5 pr-20 focus:outline-none focus:border-transparent transition-all duration-300"
              />
              <button type="button" 
                onClick={props.onPaste} 
                class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 text-cyan-700 text-base px-4 py-2 rounded-lg transition-all duration-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 112 2h2a2 2 0 012-2"></path>
                </svg>
                Paste
              </button>
            </div>
            <button type="submit" 
              disabled={props.loading || props.autoProcessing}
              class="h-14 px-8 bg-emerald-500 disabled:from-gray-500 disabled:to-gray-400 text-lg text-white font-medium rounded flex items-center justify-center gap-2 disabled:transform-none disabled:cursor-not-allowed">
              {props.loading ? (
                <>
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Processing...
                </>
              ) : props.autoProcessing ? (
                <>
                  <svg class="animate-pulse h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                  </svg>
                  Auto-starting...
                </>
              ) : (
                <>
                  
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M8.25003 2.83333C8.25003 2.3731 8.62313 2 9.08336 2H14.9167C15.3769 2 15.75 2.3731 15.75 2.83333V9.5H19.9167C20.2579 9.5 20.5646 9.70794 20.6908 10.0249C20.8171 10.3418 20.7375 10.7037 20.4898 10.9383L12.5732 18.4383C12.2517 18.7428 11.7483 18.7428 11.4269 18.4383L3.51024 10.9383C3.26258 10.7037 3.18294 10.3418 3.30923 10.0249C3.43551 9.70794 3.74221 9.5 4.08336 9.5H8.25003V2.83333ZM9.9167 3.66667V10.3333C9.9167 10.7936 9.5436 11.1667 9.08336 11.1667H6.17468L12 16.6854L17.8254 11.1667H14.9167C14.4565 11.1667 14.0834 10.7936 14.0834 10.3333V3.66667H9.9167Z" fill="white"/>
					<path d="M9.9167 10.3333V3.66667H14.0834V10.3333C14.0834 10.7936 14.4565 11.1667 14.9167 11.1667H17.8254L12 16.6854L6.17468 11.1667H9.08336C9.5436 11.1667 9.9167 10.7936 9.9167 10.3333Z" fill="white"/>
					<rect x="3" y="21.3333" width="18" height="2" fill="white"/>
				</svg>

                  Download
                </>
              )}
            </button>
          </form>
          
          {/* Auto-processing indicator with cancel option */}
          {props.autoProcessing && (
            <div class="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-between">
              <div class="flex items-center gap-2 text-blue-700">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span class="text-sm font-medium">Auto-processing extracted URL...</span>
              </div>
              <button 
                onClick={props.onCancelAutoProcessing}
                class="text-blue-600 hover:text-blue-800 text-sm underline transition-colors">
                Cancel
              </button>
            </div>
          )}
          
          
        </div>
        {/* URL Format Help */}
        <div class="text-base text-white/70">
          <p>
            {props.autoProcessing ? (
              <span class="flex items-center gap-1">
                <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Auto-processing TikTok Lite shared content...
              </span>
            ) : (
              ""
            )}
          </p>
        </div>
      </div>

      {props.error && (
        <div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <strong>Error:</strong>
          </div>
          <p class="mt-1">{props.error}</p>
        </div>
      )}
    </div>
  );
}

export default InputSection;