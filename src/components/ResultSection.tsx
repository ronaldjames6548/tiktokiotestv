// src/components/ResultSection.tsx
interface ResultSectionProps {
  data: {
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
      thumbnail?: string | null;
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
    } | null;
  };
  getVideoUrl: () => string;
  getAuthorInfo: () => { avatar: string; nickname: string };
  getSafeFilename: () => string;
  onDownloadClick: (downloadUrl: string, filename: string) => void;
}

function ResultSection(props: ResultSectionProps) {
  console.log("🎨 ResultSection rendering");
  console.log("📦 Props data:", props.data);
  console.log("📊 Result stats:", {
    views: props.data?.result?.views,
    likes: props.data?.result?.likes,
    comments: props.data?.result?.comments,
    shares: props.data?.result?.shares,
    avatar: props.data?.result?.author?.avatar
  });
  
  if (!props.data || !props.data.result) {
    console.log("❌ No data or result, returning null");
    return null;
  }
  
  const result = props.data.result;
  
  // Helper to generate filename based on type
  const generateFilename = (baseName: string, type: 'video' | 'audio' | 'watermark' | 'avatar') => {
    let filename = baseName;
    if (type === 'audio') {
      filename += '_audio';
    } else if (type === 'watermark') {
      filename += '_watermark';
    } else if (type === 'avatar') {
      filename += '_avatar';
    }
    return filename;
  };

  // Function to download avatar directly without modal
  const downloadAvatar = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    const avatarUrl = props.getAuthorInfo().avatar;
    if (!avatarUrl) {
      console.error("No avatar URL available");
      return;
    }

    console.log("Downloading avatar from:", avatarUrl);
    
    try {
      // Fetch the image as blob to avoid browser opening it
      const response = await fetch(avatarUrl, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch avatar');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = generateFilename(props.getSafeFilename(), 'avatar') + '.jpg';
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log("✅ Avatar download started");
    } catch (error) {
      console.error("❌ Avatar download failed:", error);
      // Fallback: open in new tab if fetch fails
      window.open(avatarUrl, '_blank');
    }
  };
  
  // Get stats with defaults
  const views = result.views || 0;
  const likes = result.likes || 0;
  const comments = result.comments || 0;
  const shares = result.shares || 0;
  
  // Thumbnail for background
  const thumbnail = result.thumbnail;
  
  // Get author info
  const authorInfo = props.getAuthorInfo();
  const avatarUrl = authorInfo.avatar;
  
  console.log("🖼️ Thumbnail URL:", thumbnail);
  console.log("👤 Avatar URL:", avatarUrl);
  
  return (
    <div class="mt-6">
      <div class="mt-4 max-w-6xl mx-auto">
        <div 
          class="relative rounded-lg overflow-hidden border border-white/10 p-4"
          style={{ minHeight: '500px' }}
        >
          {/* Background Image */}
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
                onLoad={() => console.log("✅ Background image loaded")}
                onError={(e) => {
                  console.error("❌ Background image failed to load");
                  e.currentTarget.style.display = 'none';
                }}
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
          
          {/* Content Layer */}
          <div class="relative" style={{ zIndex: 10 }}>
            <div class="flex flex-col md:flex-row gap-4">
              {/* Left Column - Video Preview */}
              <div class="md:w-1/3 flex-shrink-0">
                <div class="relative rounded-lg overflow-hidden max-h-[430px] bg-black">
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
                {(views > 0 || likes > 0 || comments > 0 || shares > 0) && (
                  <div class="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    {/* Views */}
                    {views > 0 && (
                      <div class="flex items-center gap-1">
                        <svg aria-label="Views" class="flex-shrink-0" fill="gray" height="20" role="img" viewBox="0 0 24 24" width="20">
                          <title>Views</title>
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path>
                        </svg>
                        <span class="font-semibold text-xs">{views.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Likes */}
                    {likes > 0 && (
                      <div class="flex items-center gap-1">
                        <svg aria-label="Like" class="flex-shrink-0" fill="red" height="20" role="img" viewBox="0 0 24 24" width="20">
                          <title>Like</title>
                          <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                        </svg>
                        <span class="font-semibold text-xs">{likes.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Comments */}
                    {comments > 0 && (
                      <div class="flex items-center gap-1">
                        <svg aria-label="Comment" class="flex-shrink-0" style="color: green;" fill="none" height="20" role="img" viewBox="0 0 24 24" width="20">
                          <title>Comment</title>
                          <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                        <span class="font-semibold text-xs">{comments.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Shares */}
                    {shares > 0 && (
                      <div class="flex items-center gap-1">
                        <svg aria-label="Share" class="flex-shrink-0" fill="none" height="20" role="img" viewBox="0 0 24 24" width="20" style="color: blue;">
                          <title>Share</title>
                          <path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path>
                          <line stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7.488" x2="15.515" y1="12.208" y2="7.641"></line>
                        </svg>
                        <span class="font-semibold text-xs">{shares.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Right Column - Author Info & Download Buttons */}
              <div class="md:w-2/3 flex flex-col justify-between">
                <div class="mb-3">
                  {/* Author Info with Avatar Download */}
                  <div class="flex items-center gap-3 mb-4">
                    {avatarUrl ? (
                      <div class="relative group">
                        <img
                          src={avatarUrl}
                          alt={authorInfo.nickname}
                          class="rounded-full w-20 h-20 object-cover border-2 border-gray-300 shadow-md"
                          referrerpolicy="no-referrer"
                          crossorigin="anonymous"
                          onLoad={() => console.log("✅ Avatar loaded successfully")}
                          onError={(e) => {
                            console.error("❌ Avatar failed to load:", avatarUrl);
                            // Try to load without referrer policy
                            e.currentTarget.removeAttribute('referrerpolicy');
                          }}
                        />
                        {/* Download button overlay */}
                        <button
                          onClick={downloadAvatar}
                          class="absolute inset-0 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer"
                          title="Download profile picture"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div class="rounded-full w-20 h-20 bg-gray-300 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {authorInfo.nickname}
                      </h2>
                      {avatarUrl && (
                        <button
                          onClick={downloadAvatar}
                          class="text-sm text-blue-600 hover:text-blue-800 underline mt-1 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Profile Picture
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div class="text-gray-900 dark:text-gray-100 text-base mb-4 bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg">
                    {result.desc || "No description available"}
                  </div>
                </div>
                
                {/* Download Buttons */}
                <div class="space-y-2">
                  {/* Download SD */}
                  {result.videoSD && (
                    <button
                      class="download-button bg-amber-600 hover:bg-amber-700 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(result.videoSD!)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'video')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download SD (No Watermark)
                    </button>
                  )}
                  
                  {/* Download HD */}
                  {(result.videoHD || result.video_hd) && (
                    <button
                      class="download-button bg-amber-600 hover:bg-amber-700 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent((result.videoHD || result.video_hd)!)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'video')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download HD (No Watermark)
                    </button>
                  )}
                  
                  {/* Download with Watermark */}
                  {result.videoWatermark && (
                    <button
                      class="download-button bg-blue-600 hover:bg-blue-700 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(result.videoWatermark!)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename(props.getSafeFilename(), 'watermark')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Download (With Watermark)
                    </button>
                  )}
                  
                  {/* Download Audio */}
                  {result.music && (
                    <button
                      class="download-button bg-purple-600 hover:bg-purple-700 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(result.music!)}&type=.mp3&title=${props.getSafeFilename()}_audio`,
                        generateFilename(props.getSafeFilename(), 'audio')
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                      Download Audio Only
                    </button>
                  )}
                  
                  {/* Download Another */}
                  <button 
                    class="download-button bg-gray-700 hover:bg-gray-800 w-full p-3 rounded text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Download Another Video
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

