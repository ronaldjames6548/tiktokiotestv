// src/components/ResultSection.tsx
interface ResultSectionProps {
  data: any; // TikTokData | null
  getVideoUrl: () => string;
  getAuthorInfo: () => { avatar: string; nickname: string };
  getSafeFilename: () => string;
  onDownloadClick: (downloadUrl: string, filename: string) => void;
}

function ResultSection(props: ResultSectionProps) {
  if (!props.data || !props.data.result) {
    return null;
  }

  // Helper to generate filename based on type
  const generateFilename = (baseName: string, type: 'video' | 'audio' | 'watermark') => {
    let filename = baseName;
    if (type === 'audio') {
      filename += '_audio';
    } else if (type === 'watermark') {
      filename += '_watermark';
    }
    return filename;
  };

  const thumbnail = props.data.result.thumbnail;
  // Use description or fallback to "Video TikTok" to match the image
  const displayTitle = props.data.result.desc 
    ? (props.data.result.desc.length > 50 ? props.data.result.desc.substring(0, 50) + '...' : props.data.result.desc)
    : "Video TikTok";

  return (
    <div class="mt-6 w-full max-w-4xl mx-auto">
      {/* Main Card Container with Relative Positioning for Background */}
      <div 
        class="relative rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4"
        style={{ minHeight: '300px' }}
      >
        {/* --- Background Image Layer --- */}
        {thumbnail && (
          <>
            <img 
              src={thumbnail} 
              alt="background" 
              class="absolute top-0 left-0 w-full h-full object-cover blur-sm"
              style={{ 
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
            
            {/* White Overlay to ensure text readability */}
            <div 
              class="absolute top-0 left-0 w-full h-full bg-white/60"
              style={{ 
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />
          </>
        )}

        {/* --- Content Layer (z-index 10 to sit above background) --- */}
        <div class="relative z-10 flex flex-col md:flex-row gap-4">
          
          {/* Left Side: Thumbnail with Play Overlay */}
          <div class="relative w-full md:w-48 flex-shrink-0 aspect-[9/16] md:aspect-auto md:h-64 bg-black rounded-lg overflow-hidden group shadow-md">
            {thumbnail && (
              <img 
                src={thumbnail} 
                alt="Video thumbnail" 
                class="w-full h-full object-cover opacity-90"
              />
            )}
            {/* Play Button Overlay */}
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center pl-1 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-black">
                  <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Center: Title info & Stats */}
          <div class="flex-1 pt-2 flex flex-col">
            <h3 class="text-lg font-bold text-gray-900 mb-1">
              {displayTitle}
            </h3>
            
            {/* Author Meta Data */}
            <p class="text-sm text-gray-600 font-medium mb-2">
              Author: {props.getAuthorInfo().nickname}
            </p>

            {/* Avatar Image (Placed after Author Meta Data) */}
            {props.getAuthorInfo().avatar && (
              <div class="flex justify-center mb-4">
                <img
                  src={props.getAuthorInfo().avatar}
                  alt={props.getAuthorInfo().nickname}
                  class="rounded-full w-24 h-24 border border-gray-300 shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Stats Section */}
            {(props.data.result.views > 0 || props.data.result.likes > 0 || props.data.result.comments > 0 || props.data.result.shares > 0) && (
              <div class="flex flex-wrap items-center gap-4 mt-auto text-sm text-gray-700 bg-white/50 p-2 rounded-lg backdrop-blur-sm">
                {/* Views */}
                <div class="flex items-center gap-1" title="Views">
                  <svg aria-label="Views" class="w-5 h-5" fill="gray" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path>
                  </svg>
                  <span class="font-semibold">{props.data.result.views.toLocaleString()}</span>
                </div>
                
                {/* Likes */}
                <div class="flex items-center gap-1" title="Likes">
                  <svg aria-label="Like" class="w-5 h-5" fill="red" viewBox="0 0 24 24">
                    <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                  </svg>
                  <span class="font-semibold">{props.data.result.likes.toLocaleString()}</span>
                </div>
                
                {/* Comments */}
                <div class="flex items-center gap-1" title="Comments">
                  <svg aria-label="Comment" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" stroke-linejoin="round"></path>
                  </svg>
                  <span class="font-semibold">{props.data.result.comments.toLocaleString()}</span>
                </div>
                
                {/* Shares */}
                <div class="flex items-center gap-1" title="Shares">
                  <svg aria-label="Share" class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" stroke-linejoin="round"></path>
                    <line stroke-linecap="round" stroke-linejoin="round" x1="7.488" x2="15.515" y1="12.208" y2="7.641"></line>
                  </svg>
                  <span class="font-semibold">{props.data.result.shares.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Blue Buttons Stack */}
          <div class="w-full md:w-64 flex flex-col gap-2 z-20">
            
            {/* Button 1: MP4 [1] (Usually No Watermark/SD) */}
            {props.data.result.videoSD && (
              <button
                class="w-full bg-[#22C55E] hover:bg-green-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                onClick={() => props.onDownloadClick(
                  `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.videoSD)}&type=.mp4&title=${props.getSafeFilename()}`,
                  generateFilename(props.getSafeFilename(), 'video')
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Download MP4 [1]
              </button>
            )}

            {/* Button 2: MP4 [2] (Usually Watermark or Alternative) */}
            {props.data.result.videoWatermark && (
              <button
                class="w-full bg-[#22C55E] hover:bg-green-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                onClick={() => props.onDownloadClick(
                  `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.videoWatermark)}&type=.mp4&title=${props.getSafeFilename()}`,
                  generateFilename(props.getSafeFilename(), 'watermark')
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Download MP4 [2]
              </button>
            )}

            {/* Button 3: MP4 HD */}
            {(props.data.result.videoHD || props.data.result.video_hd) && (
              <button
                class="w-full bg-[#22C55E] hover:bg-green-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                onClick={() => props.onDownloadClick(
                  `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent((props.data.result.videoHD || props.data.result.video_hd)!)}&type=.mp4&title=${props.getSafeFilename()}`,
                  generateFilename(props.getSafeFilename(), 'video')
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Download MP4 HD
              </button>
            )}

            {/* Button 4: MP3 */}
            {props.data.result.music && (
              <button
                class="w-full bg-[#22C55E] hover:bg-green-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                onClick={() => props.onDownloadClick(
                  `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.music)}&type=.mp3&title=${props.getSafeFilename()}_audio`,
                  generateFilename(props.getSafeFilename(), 'audio')
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Download MP3
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dark "Download more videos" Bar */}
      <div class="mt-4">
        <a 
          href="/" 
          class="block w-full bg-[#1CA24D] hover:bg-green-500 text-white text-center py-3 rounded-none md:rounded text-sm font-normal no-underline transition-colors"
        >
          Download more videos
        </a>
      </div>
    </div>
  );
}

export default ResultSection;