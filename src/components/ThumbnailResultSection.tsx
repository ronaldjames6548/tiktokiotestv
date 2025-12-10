// src/components/ResultSection.tsx
interface ResultSectionProps {
  data: any; // TikTokData | null
  getVideoUrl: () => string;
  getAuthorInfo: () => { avatar: string; nickname: string };
  getSafeFilename: () => string;
  onDownloadClick: (downloadUrl: string, filename: string) => void;
}

function ResultSection(props: ResultSectionProps) {
  console.log("DEBUG: ResultSection rendering with props.data:", props.data);
  console.log("DEBUG: props.data?.result exists?", !!props.data?.result);
  
  if (!props.data || !props.data.result) {
    return null;
  }
  
  // Helper to generate filename based on type
  const generateFilename = (baseName: string, type: 'video' | 'audio' | 'watermark' | 'thumbnail') => {
    let filename = baseName;
    if (type === 'audio') {
      filename += '_audio';
    } else if (type === 'watermark') {
      filename += '_watermark';
    } else if (type === 'thumbnail') {
      filename += '_thumbnail';
    }
    return filename;
  };
  
  // Thumbnail for background
  const thumbnail = props.data.result.thumbnail;
  
  console.log("DEBUG: Using IMG tag approach for thumbnail:", thumbnail);
  
  return (
    <div class="mt-6">
      <div class="mt-4 max-w-6xl mx-auto">
        {/* Container with relative positioning */}
        <div 
          class="relative rounded-lg overflow-hidden border border-white/10 p-4"
          style={{ minHeight: '500px' }}
        >
          {/* Background Image as IMG tag */}
          {thumbnail && (
            <>
              <img 
                src={thumbnail} 
                alt="background" 
                class="absolute top-0 left-0 w-full h-full object-cover"
                style={{ 
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
                onLoad={() => console.log("✅ Background IMG loaded successfully")}
                onError={() => console.error("❌ Background IMG failed to load")}
              />
              
              {/* White overlay */}
              <div 
                class="absolute top-0 left-0 w-full h-full bg-white"
                style={{ 
                  zIndex: 2,
                  opacity: 0.5,
                  pointerEvents: 'none'
                }}
              />
            </>
          )}
          
          {/* Content Layer - positioned above background */}
          <div class="relative" style={{ zIndex: 10 }}>
            <div class="flex flex-col md:flex-row gap-4">
              <div class="md:w-1/3 flex-shrink-0">
                <div class="relative rounded-lg overflow-hidden max-h-[430px]">
                  {props.getVideoUrl() && (
                    <video
                      controls
                      src={props.getVideoUrl()}
                      class="w-full h-full object-cover"
                      referrerpolicy="no-referrer"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                
                {/* Stats Section */}
                {(props.data.result.views > 0 || props.data.result.likes > 0 || props.data.result.comments > 0 || props.data.result.shares > 0) && (
                  <div class="flex items-center gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {/* Views */}
                    <div class="flex items-center gap-1">
                      <svg aria-label="Views" class="x1lliihq x1n2onr6 xyb1xck" fill="gray" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Views</title>
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path>
                      </svg>
                      {props.data.result.views.toLocaleString()}
                    </div>
                    
                    {/* Likes */}
                    <div class="flex items-center gap-1">
                      <svg aria-label="Like" class="x1lliihq x1n2onr6 xyb1xck" fill="red" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Like</title>
                        <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                      </svg>
                      {props.data.result.likes.toLocaleString()}
                    </div>
                    
                    {/* Comments */}
                    <div class="flex items-center gap-1">
                      <svg aria-label="Comment" class="x1lliihq x1n2onr6 x5n08af" style="color: green;" height="24" role="img" viewBox="0 0 24 24" width="24">
                        <title>Comment</title>
                        <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path>
                      </svg>
                      {props.data.result.comments.toLocaleString()}
                    </div>
                    
                    {/* Shares */}
                    <div class="flex items-center gap-1">
                      <svg aria-label="Share" class="x1lliihq x1n2onr6 xyb1xck" height="24" role="img" viewBox="0 0 24 24" width="24" style="color: blue;">
                        <title>Share</title>
                        <path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path>
                        <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7.488" x2="15.515" y1="12.208" y2="7.641"></line>
                      </svg>
                      {props.data.result.shares.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              
              <div class="md:w-2/3 flex flex-col justify-between">
                <div class="mb-3">
                  <div class="flex items-center gap-3 justify-between mb-1">
                    {props.getAuthorInfo().avatar && (
                      <img
                        src={props.getAuthorInfo().avatar}
                        alt={props.getAuthorInfo().nickname}
                        class="rounded-full w-24 h-24"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                      {props.getAuthorInfo().nickname}
                    </h2>
                    <div class="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full"></div>
                  </div>
                  <div class="text-gray-900 text-base mb-2">
                    {props.data.result.desc || "No description available"}
                  </div>

                  <div class="flex justify-center my-4">
                    {/* Empty space or optional placeholder */}
                  </div>
                </div>
                
                <div class="space-y-2">
                  {/* Download SD */}
                  {props.data.result.videoSD && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.videoSD)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'video')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download SD (No Watermark)
                    </button>
                  )}
                  
                  {/* Download HD */}
                  {(props.data.result.videoHD || props.data.result.video_hd) && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent((props.data.result.videoHD || props.data.result.video_hd)!)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'video')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download HD (No Watermark)
                    </button>
                  )}
                  
                  {/* Download with Watermark */}
                  {props.data.result.videoWatermark && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.videoWatermark)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'watermark')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                      Download (With Watermark)
                    </button>
                  )}
                  
                  {/* Download Thumbnail - NEW BUTTON */}
                  {thumbnail && (
                    <button
                      class="download-button bg-purple-600 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(thumbnail)}&type=.jpg&title=${props.getSafeFilename()}_thumbnail`,
                        generateFilename(props.getSafeFilename(), 'thumbnail')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Download Thumbnail
                    </button>
                  )}
                  
                  {/* Download Audio */}
                  {props.data.result.music && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(props.data.result.music)}&type=.mp3&title=${props.getSafeFilename()}_audio`,
                        generateFilename(props.getSafeFilename(), 'audio')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                      Download Audio Only
                    </button>
                  )}
                  
                  {/* Download Another */}
                  <button class="download-button bg-amber-900 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer">
                    <a href="/" class="text-white no-underline">Download Another Video</a>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultSection;