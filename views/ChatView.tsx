import React, { useState, useEffect, useRef } from 'react';
import { ModelNames } from '../types';
import { generateChatResponse, transcribeAudio } from '../services/geminiService';
import { Button, Input, Card, Loader } from '../components/UIComponents';
import { ICONS } from '../constants';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string; text: string; grounding?: any }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'fast' | 'thinking'>('standard');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (useMaps && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        (error) => console.error("Error getting location", error)
      );
    }
  }, [useMaps]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async (textOverride?: string) => {
    const userMsg = typeof textOverride === 'string' ? textOverride : input;
    if (!userMsg.trim()) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    let model = ModelNames.PRO;
    if (mode === 'fast') model = ModelNames.FLASH_LITE;
    if (mode === 'standard' && (useSearch || useMaps)) model = ModelNames.FLASH;
    if (mode === 'thinking') model = ModelNames.PRO;

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const result = await generateChatResponse(
        model, 
        history, 
        userMsg, 
        mode === 'thinking', 
        useSearch, 
        useMaps, 
        location
      );

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text || "No text response generated.",
        grounding: result.groundingMetadata 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error generating response. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const text = await transcribeAudio(base64Audio, audioBlob.type);
            if (text) {
              handleSend(text);
            }
          } catch (e) {
            console.error("Transcription error:", e);
          } finally {
            setLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex gap-6 max-w-7xl mx-auto relative p-2">
      {/* Left Control Panel */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 hidden md:flex">
         <Card className="h-fit space-y-6 sticky top-4" title="Configuration">
            {/* Model Selection */}
            <div>
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                 {ICONS.Brain} Intelligence Level
               </label>
               <div className="flex flex-col gap-2">
                  {(['standard', 'fast', 'thinking'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        mode === m 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{m}</span>
                        {mode === m && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>}
                      </div>
                      <span className="text-[10px] opacity-80 font-normal block mt-1">
                        {m === 'fast' ? 'Lowest latency, high speed' : m === 'thinking' ? 'Deep reasoning & logic' : 'Balanced performance'}
                      </span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Grounding Tools */}
            <div>
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                 {ICONS.Search} Real-time Data
               </label>
               <div className="space-y-3">
                  <label className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl border transition-all ${useSearch ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${useSearch ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{ICONS.Search}</div>
                        <span className={`text-sm font-medium ${useSearch ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>Google Search</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${useSearch ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {useSearch && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="hidden" />
                  </label>
                  
                  <label className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl border transition-all ${useMaps ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${useMaps ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{ICONS.Map}</div>
                        <span className={`text-sm font-medium ${useMaps ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>Google Maps</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${useMaps ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {useMaps && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <input type="checkbox" checked={useMaps} onChange={(e) => setUseMaps(e.target.checked)} className="hidden" />
                  </label>
               </div>
            </div>
         </Card>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-2xl">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6 scroll-smooth custom-scrollbar relative">
            {messages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-500/30 animate-in zoom-in duration-500">
                    <div className="scale-150">{ICONS.Chat}</div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">How can I help you?</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">I can write code, analyze data, or search the web for real-time information.</p>
                </div>
            )}
            
            {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 shadow-sm ${
                msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                
                {/* Grounding Display */}
                {msg.grounding?.groundingChunks && (
                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/20 dark:border-white/10">
                    {msg.grounding.groundingChunks.map((chunk: any, i: number) => {
                        if (chunk.web) return <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-white/20 dark:bg-black/20 rounded-full text-xs font-medium hover:bg-white/30 dark:hover:bg-black/40 transition-colors border border-white/10 max-w-full truncate"><span className="opacity-70">{ICONS.Search}</span> {chunk.web.title || "Source"}</a>;
                        if (chunk.maps) return <a key={i} href={chunk.maps.webUri || chunk.maps.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 rounded-full text-xs font-medium text-green-100 hover:bg-green-900/50 transition-colors border border-green-500/30"><span className="opacity-70">{ICONS.Map}</span> {chunk.maps.title}</a>
                        return null;
                    })}
                    </div>
                )}
                </div>
            </div>
            ))}
            {loading && (
            <div className="flex justify-start animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Loader />
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md border-t border-slate-200/50 dark:border-white/10 relative z-20">
            <div className="relative flex gap-3 items-end">
                <Button 
                   onClick={isRecording ? stopRecording : startRecording}
                   className={`rounded-xl px-4 py-3.5 aspect-square shrink-0 h-[56px] ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                   variant={isRecording ? 'danger' : 'secondary'}
                >
                   {ICONS.Mic}
                </Button>
                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none max-h-32 min-h-[56px]"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button onClick={() => handleSend()} disabled={loading || !input.trim()} className="rounded-xl px-4 py-3.5 aspect-square shrink-0 h-[56px]">
                    {loading ? <div className="scale-75"><Loader /></div> : <span className="rotate-90 text-xl">➤</span>}
                </Button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">Gemini can make mistakes. Check important info.</div>
        </div>
      </div>
    </div>
  );
};