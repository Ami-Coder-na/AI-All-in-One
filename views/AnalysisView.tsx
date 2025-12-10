import React, { useState } from 'react';
import { analyzeMedia, transcribeAudio, generateSpeech } from '../services/geminiService';
import { Button, Input, Card, FileUpload, Loader } from '../components/UIComponents';
import { ModelNames } from '../types';

export const AnalysisView: React.FC = () => {
  const [section, setSection] = useState<'vision' | 'audio'>('vision');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  
  // Vision State
  const [visionFiles, setVisionFiles] = useState<{ base64: string, mime: string, name: string }[]>([]);
  
  // Audio State
  const [audioMode, setAudioMode] = useState<'file' | 'url'>('file');
  const [audioFile, setAudioFile] = useState<{ base64: string, mime: string, name: string } | null>(null);
  const [audioInputUrl, setAudioInputUrl] = useState('');
  
  // Shared
  const [prompt, setPrompt] = useState('');

  const handleVisionFiles = (files: File[]) => {
    Promise.all(files.map(f => new Promise<{ base64: string, mime: string, name: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
             resolve({
                 base64: (reader.result as string).split(',')[1],
                 mime: f.type,
                 name: f.name
             });
        };
        reader.readAsDataURL(f);
    }))).then(processed => {
        setVisionFiles(prev => [...prev, ...processed]);
    });
  };

  const removeVisionFile = (index: number) => {
    setVisionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAudioFile = (f: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAudioFile({ base64, mime: f.type, name: f.name });
    };
    reader.readAsDataURL(f);
  };

  const handleProcess = async () => {
    setLoading(true);
    setOutput('');
    try {
      if (section === 'vision') {
        if (visionFiles.length === 0) return;
        
        let combinedOutput = '';
        for (let i = 0; i < visionFiles.length; i++) {
            const file = visionFiles[i];
            combinedOutput += `[ANALYZING: ${file.name}]...\n`;
            setOutput(combinedOutput); // Stream updates
            
            const res = await analyzeMedia(
                ModelNames.PRO_VISION, 
                prompt || "Describe this in detail.", 
                file.base64, 
                file.mime
            );
            
            combinedOutput += `${res}\n\n${"=".repeat(40)}\n\n`;
            setOutput(combinedOutput);
        }
        
      } else {
        // Audio Section
        let audioData = null;
        let mime = '';

        if (audioMode === 'file' && audioFile) {
            audioData = audioFile.base64;
            mime = audioFile.mime;
        } else if (audioMode === 'url' && audioInputUrl) {
            try {
                // Note: This relies on the server allowing CORS or the file being accessible
                setOutput(`Fetching audio from ${audioInputUrl}...`);
                const response = await fetch(audioInputUrl);
                if (!response.ok) throw new Error("Failed to fetch audio file");
                const blob = await response.blob();
                mime = blob.type || 'audio/mp3'; // Default fallback
                
                audioData = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            } catch (e: any) {
                throw new Error(`URL Fetch Error: ${e.message}. Note: Browser CORS policies may block external URLs.`);
            }
        }

        if (audioData) {
          // Transcription
          setOutput("Transcribing audio...");
          const res = await transcribeAudio(audioData, mime);
          setOutput(res || "No transcription available.");
        } else if (prompt && !audioData) {
          // TTS (if no audio input provided, assume TTS)
          const audioBase64 = await generateSpeech(prompt);
          if (audioBase64) {
             playPcmAudio(audioBase64);
             setOutput("Audio generated and playing...");
          }
        } else {
            throw new Error("Please provide audio input for transcription or text for TTS.");
        }
      }
    } catch (e: any) {
      setOutput(prev => prev + `\nError: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const playPcmAudio = async (base64: string) => {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for(let i=0; i<channelData.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
       {/* Mode Switcher */}
       <div className="flex justify-center mb-8">
        <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl inline-flex">
           <button 
             onClick={() => { setSection('vision'); setOutput(''); }} 
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${section === 'vision' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             Vision & Video
           </button>
           <button 
             onClick={() => { setSection('audio'); setOutput(''); }} 
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${section === 'audio' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             Audio & Speech
           </button>
        </div>
       </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Input Column */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <Card title={section === 'vision' ? "Source Material" : "Audio Input"} className="flex-1">
             <div className="space-y-6">
               {section === 'vision' ? (
                 <>
                   <div className="p-1">
                      <FileUpload multiple onFilesSelect={handleVisionFiles} accept="image/*,video/*" label="Upload Images or Videos (Batch)" />
                      {visionFiles.length > 0 && (
                          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                              {visionFiles.map((f, i) => (
                                  <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs">
                                      <span className="truncate max-w-[80%] text-slate-700 dark:text-slate-300">{f.name}</span>
                                      <button onClick={() => removeVisionFile(i)} className="text-red-500 hover:text-red-600">×</button>
                                  </div>
                              ))}
                          </div>
                      )}
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Instruction</label>
                      <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="E.g., What is happening in these files?" />
                   </div>

                   <Button onClick={handleProcess} disabled={visionFiles.length === 0 || loading} className="w-full py-3">
                     {loading ? <Loader /> : `Analyze ${visionFiles.length} File${visionFiles.length !== 1 ? 's' : ''}`}
                   </Button>
                 </>
               ) : (
                 <div className="space-y-8">
                   <div className="space-y-3">
                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Transcription</h4>
                     <p className="text-xs text-slate-500">Convert audio files or URLs to text using Gemini Flash.</p>
                     
                     <div className="flex gap-2 mb-2">
                        <button 
                            onClick={() => setAudioMode('file')}
                            className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${audioMode === 'file' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            Upload File
                        </button>
                        <button 
                            onClick={() => setAudioMode('url')}
                            className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${audioMode === 'url' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        >
                            Use URL
                        </button>
                     </div>

                     {audioMode === 'file' ? (
                        <FileUpload onFileSelect={handleAudioFile} accept="audio/*" label={audioFile ? audioFile.name : "Select Audio File"} />
                     ) : (
                        <Input value={audioInputUrl} onChange={(e) => setAudioInputUrl(e.target.value)} placeholder="https://example.com/audio.mp3" />
                     )}
                     
                     <Button 
                        onClick={handleProcess} 
                        disabled={loading || (audioMode === 'file' && !audioFile) || (audioMode === 'url' && !audioInputUrl)} 
                        className="w-full" 
                        variant="secondary"
                     >
                         Start Transcription
                     </Button>
                   </div>
                   
                   <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                   <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Text to Speech</h4>
                      <p className="text-xs text-slate-500">Generate lifelike speech from text.</p>
                      <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type text to speak..." />
                      <Button onClick={handleProcess} disabled={!prompt || loading} className="w-full">Generate Audio</Button>
                   </div>
                 </div>
               )}
             </div>
          </Card>
        </div>

        {/* Output Column */}
        <div className="flex flex-col min-h-[400px]">
           <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-800 relative">
             <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <span className="text-xs font-mono text-slate-500">OUTPUT_TERMINAL</span>
             </div>
             
             <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-sm text-green-400/90 leading-relaxed whitespace-pre-wrap">
               {loading && !output ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                     <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="animate-pulse">PROCESSING_DATA...</p>
                  </div>
               ) : (
                  output ? output : <span className="text-slate-700 dark:text-slate-600">// Waiting for input...</span>
               )}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};