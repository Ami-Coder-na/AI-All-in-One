import React, { useEffect, useRef, useState } from 'react';
import { initLiveSession } from '../services/geminiService';
import { Button } from '../components/UIComponents';
import { ICONS } from '../constants';

// Circular Audio Visualizer
const AudioVisualizer: React.FC<{ analyser: AnalyserNode | null; active: boolean }> = ({ analyser, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!active) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;
      
      // Calculate average volume for pulse effect
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const pulse = 1 + (average / 255) * 0.5;

      // Draw Center Orb
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * pulse);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.4)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulse, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Frequency Bars Ring
      const bars = 48;
      const step = (Math.PI * 2) / bars;
      
      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * (bufferLength / 2));
        const value = dataArray[dataIndex];
        const barLen = (value / 255) * 60 * pulse;
        
        const angle = i * step - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * (radius + 10);
        const y1 = centerY + Math.sin(angle) * (radius + 10);
        const x2 = centerX + Math.cos(angle) * (radius + 10 + barLen);
        const y2 = centerY + Math.sin(angle) * (radius + 10 + barLen);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, active]);

  return <canvas ref={canvasRef} width={400} height={400} className="w-[300px] h-[300px] pointer-events-none" />;
};

export const LiveView: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Toggle Track logic
  useEffect(() => {
    if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = micEnabled);
        streamRef.current.getVideoTracks().forEach(track => track.enabled = cameraEnabled);
    }
  }, [micEnabled, cameraEnabled]);

  const disconnect = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
    }
    if (processorRef.current) processorRef.current.disconnect();
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setConnected(false);
    setLoading(false);
    setAnalyser(null);
  };

  const connect = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Input Context
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      inputContextRef.current = inputCtx;
      
      // Output Context & Visualizer
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outputCtx;
      
      const analyserNode = outputCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.5;
      setAnalyser(analyserNode);

      const outputNode = outputCtx.createGain();
      outputNode.connect(analyserNode);
      analyserNode.connect(outputCtx.destination);
      
      let nextStartTime = 0;

      const sessionPromise = initLiveSession(
        () => {
            setConnected(true);
            setLoading(false);
            
            // Audio Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const binary = String.fromCharCode(...new Uint8Array(int16.buffer));
                const b64 = btoa(binary);

                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: { mimeType: 'audio/pcm;rate=16000', data: b64 }
                    });
                });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);

            // Video Frame Processing (1 FPS)
            intervalRef.current = window.setInterval(() => {
                if (canvasRef.current && videoRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if(ctx) {
                        canvasRef.current.width = videoRef.current.videoWidth || 640;
                        canvasRef.current.height = videoRef.current.videoHeight || 480;
                        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        const b64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: { mimeType: 'image/jpeg', data: b64 }
                            });
                        });
                    }
                }
            }, 1000); 
        },
        async (msg: any) => {
            // Audio Output Handling
            const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data) {
                const binaryString = atob(data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                
                const dataInt16 = new Int16Array(bytes.buffer);
                const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
                const ch = buffer.getChannelData(0);
                for(let i=0; i<ch.length; i++) ch[i] = dataInt16[i] / 32768.0;

                const src = outputCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(outputNode);
                
                const now = outputCtx.currentTime;
                const start = Math.max(now, nextStartTime);
                src.start(start);
                nextStartTime = start + buffer.duration;
            }
        },
        (err: any) => { 
            console.error(err); 
            disconnect();
        },
        () => { 
            disconnect();
        }
      );
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
        console.error(e);
        setLoading(false);
    }
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
       {/* Main Immersive Container */}
       <div className="relative flex-1 rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl group ring-1 ring-white/10">
          {/* Video Feed */}
          <video 
            ref={videoRef} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraEnabled ? 'opacity-100' : 'opacity-0'}`} 
            muted 
            playsInline 
          />
          {!cameraEnabled && connected && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-slate-700">{ICONS.VideoOff}</div>
              </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

          {/* Top Bar Status */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
              <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500/50'}`} />
                  <span className="font-mono text-xs font-bold text-white/80 tracking-widest uppercase">
                    {connected ? 'Live Encrypted Feed' : 'Offline'}
                  </span>
              </div>
              <div className="text-right">
                  <div className="text-xs font-mono text-white/50">{connected ? 'LATENCY: 42ms' : '--'}</div>
              </div>
          </div>

          {/* Central Interactions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              {/* Visualizer renders when connected */}
              {connected && (
                  <div className="scale-100 opacity-100 transition-all duration-700">
                     <AudioVisualizer analyser={analyser} active={connected} />
                  </div>
              )}

              {/* Start Button */}
              {!connected && !loading && (
                  <button 
                    onClick={connect}
                    className="group relative pointer-events-auto transition-all duration-300 hover:scale-105"
                  >
                     <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 animate-pulse" />
                     <div className="relative w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl hover:bg-white/20 transition-colors">
                        <div className="scale-150">{ICONS.Bolt}</div>
                     </div>
                     <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-white/80 font-medium tracking-wide text-sm">
                        INITIALIZE UPLINK
                     </div>
                  </button>
              )}

              {/* Loading Spinner */}
              {loading && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono text-blue-400 animate-pulse">ESTABLISHING CONNECTION...</span>
                 </div>
              )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto z-20">
             {connected && (
               <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
                  <button 
                    onClick={() => setMicEnabled(!micEnabled)} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                  >
                    {micEnabled ? ICONS.Mic : ICONS.MicOff}
                  </button>
                  
                  <button 
                    onClick={() => setCameraEnabled(!cameraEnabled)} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                  >
                     {cameraEnabled ? ICONS.Video : ICONS.VideoOff}
                  </button>
                  
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  
                  <button 
                    onClick={disconnect} 
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  >
                    {ICONS.PhoneHangup}
                  </button>
               </div>
             )}
          </div>
       </div>
    </div>
  );
};