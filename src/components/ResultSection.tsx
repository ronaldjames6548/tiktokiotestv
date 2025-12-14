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

  // Generate safe filename from creator + description
  const generateFilename = (type: 'video' | 'audio' | 'watermark') => {
    let base = props.getSafeFilename();
    if (type === 'audio') base += '_audio';
    if (type === 'watermark') base += '_watermark';
    return base;
  };

  return (
    <div class="mt-6">
      <div class="mt-4 max-w-6xl mx-auto">
        <div class="relative rounded-lg overflow-hidden border border-white/10 p-4" style={{ minHeight: '500px' }}>
          {/* Background thumbnail */}
          {data.thumbnail && (
            <>
              <img
                src={data.thumbnail}
                alt="Background"
                class="absolute top-0 left-0 w-full h-full object-cover"
                style={{ zIndex: 1, pointerEvents: 'none' }}
              />
              <div
                class="absolute top-0 left-0 w-full h-full bg-white"
                style={{ zIndex: 2, opacity: 0.5, pointerEvents: 'none' }}
              />
            </>
          )}

          <div class="relative" style={{ zIndex: 10 }}>
            <div class="flex flex-col md:flex-row gap-4">
              {/* Left: Video / Images */}
              <div class="md:w-1/3 flex-shrink-0">
                <div class="relative rounded-lg overflow-hidden max-h-[430px]">
                  {isPhoto ? (
                    <div class="grid grid-cols-2 gap-2">
                      {data.images?.slice(0, 4).map((img: string) => (
                        <img src={img} alt="Slide" class="w-full h-full object-cover" />
                      ))}
                    </div>
                  ) : (
                    <video
                      controls
                      src={props.getVideoUrl()}
                      class="w-full h-full object-cover"
                      referrerpolicy="no-referrer"
                    >
                      Your browser does not support video.
                    </video>
                  )}
                </div>

                {/* Stats */}
                {(data.views > 0 || data.likes > 0 || data.comments > 0 || data.shares > 0) && (
                  <div class="flex items-center gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {data.views > 0 && (
                      <div class="flex items-center gap-1">
                        <svg class="w-6 h-6" fill="gray" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        {data.views.toLocaleString()}
                      </div>
                    )}
                    {data.likes > 0 && (
                      <div class="flex items-center gap-1">
                        <svg class="w-6 h-6" fill="red" viewBox="0 0 24 24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"/></svg>
                        {data.likes.toLocaleString()}
                      </div>
                    )}
                    {data.comments > 0 && (
                      <div class="flex items-center gap-1">
                        <svg class="w-6 h-6" fill="green" viewBox="0 0 24 24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
                        {data.comments.toLocaleString()}
                      </div>
                    )}
                    {data.shares > 0 && (
                      <div class="flex items-center gap-1">
                        <svg class="w-6 h-6" fill="blue" viewBox="0 0 24 24"><path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="7.488" x2="15.515" y1="12.208" y2="7.641" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        {data.shares.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Info + Download Buttons */}
              <div class="md:w-2/3 flex flex-col justify-between">
                <div class="mb-3">
                  <div class="flex items-center gap-3 justify-between mb-1">
                    {data.thumbnail && (
                      <img
                        src={data.thumbnail}
                        alt={data.creator}
                        class="rounded-full w-24 h-24 object-cover"
                      />
                    )}
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                      {data.creator || "Unknown Creator"}
                    </h2>
                  </div>
                  <div class="text-gray-900 text-base mb-2">
                    {data.description || "No description available"}
                  </div>
                  {data.musicTitle && (
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      🎵 {data.musicTitle} - {data.musicAuthor || "Original Sound"}
                    </div>
                  )}
                </div>

                <div class="space-y-2">
                  {/* HD Download */}
                  {data.videoHd && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.videoHd)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename('video')
                      )}
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download HD (No Watermark)
                    </button>
                  )}

                  {/* SD Download (fallback if no HD) */}
                  {!data.videoHd && data.video && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.video)}&type=.mp4&title=${props.getSafeFilename()}`,
                        generateFilename('video')
                      )}
                    >
                      Download Video (No Watermark)
                    </button>
                  )}

                  {/* Audio Only */}
                  {data.music && (
                    <button
                      class="download-button bg-amber-600 w-full p-3 rounded text-white font-bold flex items-center justify-center"
                      onClick={() => props.onDownloadClick(
                        `https://dl.tiktokiocdn.workers.dev/api/download?url=${encodeURIComponent(data.music)}&type=.mp3&title=${props.getSafeFilename()}_audio`,
                        generateFilename('audio')
                      )}
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                      Download Audio Only
                    </button>
                  )}

                  {/* Download Another */}
                  <button class="download-button bg-amber-900 w-full p-3 rounded text-white font-bold">
                    <a href="/" class="text-white no-underline flex items-center justify-center">
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
