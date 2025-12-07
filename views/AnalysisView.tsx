import React, { useState } from 'react';
import { analyzeMedia, transcribeAudio, generateSpeech } from '../services/geminiService';
import { Button, Input, Card, FileUpload, Loader } from '../components/UIComponents';
import { ModelNames } from '../types';

export const AnalysisView: React.FC = () => {
  const [section, setSection] = useState<'vision' | 'audio'>('vision');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [file, setFile] = useState<{ base64: string, mime: string, name: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null); 

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFile({ base64, mime: f.type, name: f.name });
    };
    reader.readAsDataURL(f);
  };

  const handleProcess = async () => {
    setLoading(true);
    setOutput('');
    setAudioUrl(null);
    try {
      if (section === 'vision') {
        if (!file) return;
        const res = await analyzeMedia(ModelNames.PRO_VISION, prompt || "Describe this in detail.", file.base64, file.mime);
        setOutput(res || "No response.");
      } else {
        // Audio Section
        if (file) {
          // Transcription
          const res = await transcribeAudio(file.base64, file.mime);
          setOutput(res || "No transcription available.");
        } else if (prompt) {
          // TTS
          const audioBase64 = await generateSpeech(prompt);
          if (audioBase64) {
             playPcmAudio(audioBase64);
             setOutput("Audio generated and playing...");
          }
        }
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
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
             onClick={() => { setSection('vision'); setFile(null); setOutput(''); }} 
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${section === 'vision' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             Vision & Video
           </button>
           <button 
             onClick={() => { setSection('audio'); setFile(null); setOutput(''); }} 
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
                      <FileUpload onFileSelect={handleFile} accept="image/*,video/*" label={file ? file.name : "Drop Image or Video Here"} />
                      {file && <p className="text-xs text-center mt-2 text-green-500">File ready for analysis</p>}
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Instruction</label>
                      <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="E.g., What is happening in this video?" />
                   </div>

                   <Button onClick={handleProcess} disabled={!file || loading} className="w-full py-3">
                     {loading ? <Loader /> : 'Run Analysis'}
                   </Button>
                 </>
               ) : (
                 <div className="space-y-8">
                   <div className="space-y-3">
                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Transcription</h4>
                     <p className="text-xs text-slate-500">Convert audio files to text using Gemini Flash.</p>
                     <FileUpload onFileSelect={handleFile} accept="audio/*" label={file ? file.name : "Select Audio File"} />
                     <Button onClick={handleProcess} disabled={!file || loading} className="w-full" variant="secondary">Start Transcription</Button>
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
             
             <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-sm text-green-400/90 leading-relaxed">
               {loading ? (
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