// src/components/ResultSection.tsx
interface ResultSectionProps {
  data: any;
  getVideoUrl: () => string;
  getAuthorInfo: () => { avatar: string; nickname: string };
  getSafeFilename: () => string;
  onDownloadClick: (downloadUrl: string, filename: string) => void;
}

function ResultSection(props: ResultSectionProps) {
  if (!props.data) return null;

  const { data } = props;
  const isPhoto = data.type === "image";

  const generateFilename = (type: 'video' | 'audio' | 'watermark') => {
    let base = props.getSafeFilename();
    if (type === 'audio') base += '_audio';
    if (type === 'watermark') base += '_watermark';
    return base;
  };

  // Profile image fallback to thumbnail if needed
  const profileImage = data.thumbnail || "";

  return (
    <div class="mt-6">
      <div class="mt-4 max-w-6xl mx-auto">
        <div class="relative rounded-lg overflow-hidden border border-white/10 p-4" style={{ minHeight: '500px' }}>
          {/* Background thumbnail image */}
          {data.thumbnail && (
            <>
              <img
                src={data.thumbnail}
                alt="Background"
                class="absolute top-0 left-0 w-full h-full object-cover blur-sm"
                style={{ zIndex: 1, pointerEvents: 'none' }}
              />
              <div
                class="absolute top-0 left-0 w-full h-full bg-black/40"
                style={{ zIndex: 2, pointerEvents: 'none' }}
              />
            </>
          )}

          <div class="relative" style={{ zIndex: 10 }}>
            <div class="flex flex-col md:flex-row gap-6">
              {/* Left: Video / Photo + Stats */}
              <div class="md:w-1/3 flex-shrink-0">
                <div class="relative rounded-lg overflow-hidden shadow-2xl">
                  {isPhoto ? (
                    <div class="grid grid-cols-2 gap-2 p-2 bg-black/30">
                      {data.images?.slice(0, 6).map((img: string) => (
                        <img src={img} alt="Photo" class="w-full h-48 object-cover rounded" />
                      ))}
                      {data.images?.length > 6 && (
                        <div class="flex items-center justify-center bg-black/60 text-white text-xl rounded">
                          +{data.images.length - 6} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <video
                      controls
                      preload="metadata"
                      src={props.getVideoUrl()}
                      class="w-full aspect-[9/16] object-cover"
                      poster={data.thumbnail}
                    >
                      Your browser does not support video.
                    </video>
                  )}
                </div>

                {/* Stats Row */}
                <div class="flex justify-around mt-4 py-3 bg-white/10 backdrop-blur rounded-lg text-white">
                  <div class="flex flex-col items-center">
                    <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span class="text-sm font-medium">{(data.views || 0).toLocaleString()}</span>
                    <span class="text-xs opacity-70">Views</span>
                  </div>
                  <div class="flex flex-col items-center">
                    <svg class="w-6 h-6 mb-1 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"/>
                    </svg>
                    <span class="text-sm font-medium">{(data.likes || 0).toLocaleString()}</span>
                    <span class="text-xs opacity-70">Likes</span>
                  </div>
                  <div class="flex flex-col items-center">
                    <svg class="w-6 h-6 mb-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <span class="text-sm font-medium">{(data.comments || 0).toLocaleString()}</span>
                    <span class="text-xs opacity-70">Comments</span>
                  </div>
                  <div class="flex flex-col items-center">
                    <svg class="w-6 h-6 mb-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m3.632 2.684C12.114 13.938 12 14.482 12 15c0 .482.114.938.316 1.342m-3.632-2.684C7.886 12.062 7.5 11.606 7.5 11c0-.606.386-1.062.684-1.466m3.632 2.684C12.114 11.938 12 11.482 12 11c0-.482-.114-.938-.316-1.342"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                    <span class="text-sm font-medium">{(data.shares || 0).toLocaleString()}</span>
                    <span class="text-xs opacity-70">Shares</span>
                  </div>
                </div>
              </div>

              {/* Right: Creator Info + Description + Download Buttons */}
              <div class="md:w-2/3 flex flex-col justify-between text-white">
                <div>
                  <div class="flex items-center gap-4 mb-4">
                    {profileImage && (
                      <img
                        src={profileImage}
                        alt={data.creator}
                        class="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
                      />
                    )}
                    <div>
                      <h2 class="text-2xl font-bold">{data.creator || "Unknown Creator"}</h2>
                      {data.musicTitle && (
                        <p class="text-sm opacity-80 mt-1">
                          🎵 {data.musicTitle} — {data.musicAuthor || "Original Sound"}
                        </p>
                      )}
                    </div>
                  </div>

                  <p class="text-lg leading-relaxed mb-6 bg-black/30 backdrop-blur-sm p-4 rounded-lg">
                    {data.description || "No description available"}
                  </p>
                </div>

                {/* Download Buttons */}
                <div class="grid grid-cols-1 gap-3">
                  {/* Download HD (No Watermark) - Priority */}
                  {data.videoHd && (
                    <button
                      class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.videoHd)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename('video')
                      )}
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download HD (No Watermark)
                    </button>
                  )}

                  {/* Download SD (No Watermark) - Fallback */}
                  {!data.videoHd && data.video && (
                    <button
                      class="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.video)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename('video')
                      )}
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download SD (No Watermark)
                    </button>
                  )}

                  {/* Download Audio Only */}
                  {data.music && (
                    <button
                      class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.music)}&type=.mp3&title=${props.getSafeFilename()}_audio`,
                        generateFilename('audio')
                      )}
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                      Download Audio Only
                    </button>
                  )}

                  {/* Download Another Video */}
                  <button class="bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition">
                    <a href="/" class="flex items-center gap-3 w-full h-full">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Download Another Video
                    </a>
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
