import React, { useState, useRef } from 'react';
import { generateProImage, editImage, generateVeoVideo, generateImagen } from '../services/geminiService';
import { Button, Input, Select, Card, FileUpload, Loader } from '../components/UIComponents';
import { AspectRatio, ImageSize } from '../types';
import { ICONS } from '../constants';

type Tab = 'image-gen' | 'image-edit' | 'video-gen' | 'imagen-gen' | 'video-edit';

interface VideoClip {
  id: string;
  file: File;
  start: number;
  end: number;
  duration: number;
}

export const MediaGenView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('image-gen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'video'>('image');

  // Gen AI Form States
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [uploadedImage, setUploadedImage] = useState<{ base64: string, mime: string } | null>(null);

  // Video Editor States
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [overlayText, setOverlayText] = useState('');
  const [renderingProgress, setRenderingProgress] = useState(0);

  const handleFile = (file: File) => {
    // For Image Edit / Video Gen
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImage({ base64, mime: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleClipUpload = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      setClips(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        file,
        start: 0,
        end: video.duration,
        duration: video.duration
      }]);
    };
    video.src = URL.createObjectURL(file);
  };

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const updateClip = (id: string, updates: Partial<VideoClip>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleRenderVideo = async () => {
    if (clips.length === 0) return;
    setLoading(true);
    setRenderingProgress(0);
    setResultUrl(null);
    setResultType('video');
    setError(null);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    // Set standard resolution (720p)
    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    if (!ctx) {
        setError("Canvas context not available");
        setLoading(false);
        return;
    }

    try {
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
        recorder.start();

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            await new Promise<void>((resolve, reject) => {
                video.src = URL.createObjectURL(clip.file);
                video.currentTime = clip.start;
                video.onloadedmetadata = () => {
                   video.play().then(() => {
                      const draw = () => {
                         if (video.paused || video.ended || video.currentTime >= clip.end) {
                             video.pause();
                             resolve();
                             return;
                         }

                         // Draw video frame
                         // Center fit cover
                         const hRatio = canvas.width / video.videoWidth;
                         const vRatio = canvas.height / video.videoHeight;
                         const ratio = Math.max(hRatio, vRatio);
                         const centerShift_x = (canvas.width - video.videoWidth * ratio) / 2;
                         const centerShift_y = (canvas.height - video.videoHeight * ratio) / 2;
                         
                         ctx.clearRect(0,0,width,height);
                         ctx.fillStyle = '#000';
                         ctx.fillRect(0,0,width,height);
                         
                         ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, centerShift_x, centerShift_y, video.videoWidth * ratio, video.videoHeight * ratio);

                         // Draw Overlay
                         if (overlayText) {
                             ctx.font = 'bold 60px Inter, sans-serif';
                             ctx.fillStyle = 'white';
                             ctx.textAlign = 'center';
                             ctx.shadowColor = 'rgba(0,0,0,0.8)';
                             ctx.shadowBlur = 10;
                             ctx.shadowOffsetX = 2;
                             ctx.shadowOffsetY = 2;
                             ctx.fillText(overlayText, width / 2, height - 80);
                         }

                         setRenderingProgress(Math.floor(((i + (video.currentTime - clip.start) / (clip.end - clip.start)) / clips.length) * 100));
                         requestAnimationFrame(draw);
                      };
                      draw();
                   }).catch(reject);
                };
                video.onerror = reject;
            });
            URL.revokeObjectURL(video.src);
        }

        recorder.stop();
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
            setLoading(false);
            setRenderingProgress(100);
        };
    } catch (e: any) {
        console.error(e);
        setError("Rendering failed: " + e.message);
        setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      if (tab === 'image-gen') {
        const images = await generateProImage(prompt, aspectRatio, imageSize);
        if (images.length > 0) {
          setResultUrl(images[0]);
          setResultType('image');
        }
      } else if (tab === 'imagen-gen') {
        const url = await generateImagen(prompt, aspectRatio);
        if (url) {
          setResultUrl(url);
          setResultType('image');
        }
      } else if (tab === 'image-edit') {
        if (!uploadedImage) throw new Error("Please upload an image to edit.");
        const images = await editImage(uploadedImage.base64, uploadedImage.mime, prompt);
        if (images.length > 0) {
          setResultUrl(images[0]);
          setResultType('image');
        }
      } else if (tab === 'video-gen') {
        const videoRatio = aspectRatio === '9:16' ? '9:16' : '16:9'; 
        const url = await generateVeoVideo(prompt, videoRatio, uploadedImage?.base64, uploadedImage?.mime);
        setResultUrl(url);
        setResultType('video');
      }
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/10 inline-flex shadow-lg overflow-x-auto max-w-full custom-scrollbar">
          {[
            { id: 'image-gen', label: 'Create (Pro)', icon: ICONS.Image },
            { id: 'imagen-gen', label: 'Imagen 3', icon: ICONS.Image },
            { id: 'image-edit', label: 'Edit', icon: ICONS.Spark },
            { id: 'video-gen', label: 'Veo Video', icon: ICONS.Video },
            { id: 'video-edit', label: 'Video Editor', icon: ICONS.Scissors }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                  setTab(item.id as Tab); 
                  setResultUrl(null); 
                  setError(null);
                  setRenderingProgress(0);
              }}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                tab === item.id 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md transform scale-105' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <Card className="flex-1 h-fit" title={tab === 'video-edit' ? "Editor Controls" : "Configuration"}>
            <div className="space-y-6">
              
              {/* VIDEO EDITOR CONTROLS */}
              {tab === 'video-edit' ? (
                 <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">1. Add Clips</label>
                        <FileUpload onFileSelect={handleClipUpload} accept="video/*" label="Add Video Clip" />
                        
                        {clips.length > 0 && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">2. Trim & Arrange</label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {clips.map((clip, idx) => (
                                        <div key={clip.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{clip.file.name}</span>
                                                <button onClick={() => removeClip(clip.id)} className="text-red-400 hover:text-red-500 text-xs">Remove</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase">Start (s)</label>
                                                    <input 
                                                      type="number" 
                                                      min={0} 
                                                      max={clip.end} 
                                                      step={0.1}
                                                      value={clip.start} 
                                                      onChange={(e) => updateClip(clip.id, { start: Number(e.target.value) })}
                                                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase">End (s)</label>
                                                    <input 
                                                      type="number" 
                                                      min={clip.start} 
                                                      max={clip.duration} 
                                                      step={0.1}
                                                      value={clip.end} 
                                                      onChange={(e) => updateClip(clip.id, { end: Number(e.target.value) })}
                                                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">3. Add Overlay</label>
                        <Input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Subtitle Text..." />
                    </div>

                    <Button onClick={handleRenderVideo} disabled={loading || clips.length === 0} className="w-full py-4 text-lg shadow-blue-500/25">
                        {loading ? <Loader /> : (
                            <span className="flex items-center gap-2">
                                {ICONS.Video} Render Video
                            </span>
                        )}
                    </Button>
                 </div>
              ) : (
                /* GEN AI CONTROLS */
                <>
                  {(tab === 'image-edit' || tab === 'video-gen') && (
                    <div className="animate-in fade-in slide-in-from-left-4">
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Reference Input</p>
                       <FileUpload onFileSelect={handleFile} accept="image/*" label={uploadedImage ? "Change Reference" : "Upload Reference Image"} />
                       {uploadedImage && <p className="text-xs text-green-500 mt-2 flex items-center gap-1">✓ Image loaded</p>}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Prompt</label>
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder={tab === 'image-edit' ? "Ex: Add a cyberpunk neon glow..." : "Describe your imagination..."}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none h-32 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {tab !== 'image-edit' && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Aspect Ratio</label>
                        <Select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                          {tab === 'video-gen' ? (
                             <>
                              <option value="16:9">16:9 Landscape</option>
                              <option value="9:16">9:16 Portrait</option>
                             </>
                          ) : tab === 'imagen-gen' ? (
                            <>
                              <option value="1:1">1:1 Square</option>
                              <option value="16:9">16:9 Landscape</option>
                              <option value="9:16">9:16 Portrait</option>
                              <option value="4:3">4:3 Standard</option>
                              <option value="3:4">3:4 Vertical</option>
                            </>
                          ) : (
                             <>
                              <option value="1:1">1:1 Square</option>
                              <option value="16:9">16:9 Landscape</option>
                              <option value="9:16">9:16 Portrait</option>
                              <option value="4:3">4:3 Standard</option>
                              <option value="3:4">3:4 Vertical</option>
                              <option value="21:9">21:9 Ultrawide</option>
                             </>
                          )}
                        </Select>
                      </div>
                    )}

                    {tab === 'image-gen' && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Quality</label>
                        <Select value={imageSize} onChange={(e) => setImageSize(e.target.value as ImageSize)}>
                          <option value="1K">1K Standard</option>
                          <option value="2K">2K High Res</option>
                          <option value="4K">4K Ultra HD</option>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSubmit} disabled={loading || (!prompt && !uploadedImage)} className="w-full py-4 text-lg shadow-blue-500/25">
                    {loading ? <Loader /> : (
                        <span className="flex items-center gap-2">
                            {ICONS.Spark} Generate {tab === 'video-gen' ? 'Video' : 'Image'}
                        </span>
                    )}
                  </Button>
                </>
              )}
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                   <span className="text-lg">⚠</span> {error}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8 flex flex-col min-h-[400px]">
           <Card className="flex-1 relative overflow-hidden flex items-center justify-center p-0 border-0 bg-slate-100 dark:bg-slate-900 shadow-inner group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200/50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-black pointer-events-none"></div>
              
              {loading && (
                 <div className="absolute inset-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent animate-spin blur-md absolute inset-0"></div>
                        <div className="w-24 h-24 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent animate-spin"></div>
                    </div>
                    <p className="mt-8 text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                      {tab === 'video-edit' ? `Rendering Video... ${renderingProgress}%` : (tab === 'video-gen' ? 'Dreaming up a scene with Veo...' : 'Painting pixels with Gemini...')}
                    </p>
                 </div>
              )}
              
              {!loading && !resultUrl && (
                  <div className="text-center p-8 opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className="w-32 h-32 mx-auto mb-4 border-4 border-dashed border-slate-400 rounded-3xl flex items-center justify-center">
                          <span className="text-4xl text-slate-400">+</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Canvas Empty</h3>
                      <p className="text-slate-500">
                          {tab === 'video-edit' ? 'Add clips and click Render' : 'Configure parameters and hit generate'}
                      </p>
                  </div>
              )}
              
              {!loading && resultUrl && (
                 <div className="relative w-full h-full flex items-center justify-center p-4">
                    {resultType === 'image' ? (
                       <img src={resultUrl} alt="Result" className="max-w-full max-h-full rounded-lg shadow-2xl ring-1 ring-white/10" />
                    ) : (
                       <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl ring-1 ring-white/10" />
                    )}
                    <a href={resultUrl} download={`gemini-gen-${Date.now()}.${resultType === 'image' ? 'png' : 'webm'}`} className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md text-sm font-medium transition-colors border border-white/20">
                        Download
                    </a>
                 </div>
              )}
           </Card>
        </div>
      </div>
    </div>
  );
};