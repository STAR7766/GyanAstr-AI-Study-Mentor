import React, { useState, useRef, useEffect } from 'react';
import { chatWithMentor, generateSpeech, ai, encodeAudio, decodeAudio } from '../services/gemini';
import { MessageSquare, Send, User, Bot, Loader2, Volume2, VolumeX, Mic, MicOff, Signal } from 'lucide-react';
import { ChatMessage } from '../types';
import { KnowledgeGraph } from './KnowledgeGraph';
import { LiveServerMessage, Modality } from '@google/genai';

interface VivaChatProps {
  initialQuestion: string;
}

export const VivaChat: React.FC<VivaChatProps> = ({ initialQuestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: initialQuestion }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Live API Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodeRefs = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      stopLiveSession();
      window.speechSynthesis.cancel();
    };
  }, []);

  const playTTS = async (text: string) => {
    if (!isVoiceMode) return;
    const cleanText = text.replace(/```mermaid[\s\S]*?```/g, ' Diagram generated. ').replace(/\*/g, '');
    const audioData = await generateSpeech(cleanText);
    if (audioData) {
        const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
        audio.play().catch(e => console.error("Audio play failed", e));
    }
  };

  useEffect(() => {
     if (isVoiceMode && !isTyping && messages.length > 0 && !isLiveSessionActive) {
         const lastMsg = messages[messages.length - 1];
         if (lastMsg.role === 'model') {
             playTTS(lastMsg.text);
         }
     }
  }, [messages, isVoiceMode, isTyping, isLiveSessionActive]);

  const startLiveSession = async () => {
    try {
        setIsLiveSessionActive(true);
        setMessages(prev => [...prev, { role: 'model', text: "⚡ Live Oral Exam Mode Activated. I am listening..." }]);
        
        const InputContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new InputContextClass({ sampleRate: 16000 });
        inputAudioContextRef.current = inputCtx;
        
        const OutputContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const outputCtx = new OutputContextClass({ sampleRate: 24000 });
        outputAudioContextRef.current = outputCtx;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                systemInstruction: { parts: [{ text: "You are a strict but fair professor conducting an oral exam (viva). Ask one question at a time. Keep responses concise." }] }
            },
            callbacks: {
                onopen: () => {
                    const source = inputCtx.createMediaStreamSource(stream);
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmData = encodeAudio(new Uint8Array(int16.buffer));
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: {
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: pcmData
                                }
                            });
                        });
                    };
                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const outputCtx = outputAudioContextRef.current;
                    if (!outputCtx) return;

                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        const audioBuffer = await decodeAudioDataWrapper(decodeAudio(audioData), outputCtx);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        
                        const currentTime = outputCtx.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        
                        sourceNodeRefs.current.add(source);
                        source.onended = () => sourceNodeRefs.current.delete(source);
                    }

                    if (msg.serverContent?.interrupted) {
                        sourceNodeRefs.current.forEach(node => node.stop());
                        sourceNodeRefs.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onclose: () => stopLiveSession(),
                onerror: (e) => {
                    console.error("Live Session Error", e);
                    stopLiveSession();
                }
            }
        });
        
        liveSessionRef.current = sessionPromise;
        
    } catch (e) {
        console.error("Failed to start Live Session", e);
        setIsLiveSessionActive(false);
        alert("Could not start Live Voice Mode. Please check microphone permissions.");
    }
  };

  const decodeAudioDataWrapper = async (data: Uint8Array, ctx: AudioContext) => {
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for(let i=0; i<dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }

  const stopLiveSession = () => {
      setIsLiveSessionActive(false);
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      inputAudioContextRef.current = null;
      outputAudioContextRef.current = null;
      
      if (liveSessionRef.current) {
          liveSessionRef.current.then((s: any) => s.close());
          liveSessionRef.current = null;
      }
      setMessages(prev => [...prev, { role: 'model', text: "🔴 Live Session Ended." }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    window.speechSynthesis.cancel();

    const userMsg = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await chatWithMentor(history, userMsg);
      if (response) {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the neural link. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```mermaid[\s\S]*?```)/g);
    return parts.map((part, index) => {
        if (part.startsWith('```mermaid')) {
            const code = part.replace(/```mermaid|```/g, '').trim();
            // Pass isDarkMode via context or prop if possible, but here we let KnowledgeGraph assume default behavior which might need logic update
            // For now, assuming dark mode for graph in chat for high contrast
            return (
                <div key={index} className="w-full my-2">
                    <KnowledgeGraph mermaidCode={code} variant="chat" />
                </div>
            );
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="w-full h-[600px] flex flex-col border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 shadow-2xl bg-white dark:bg-[#0b0c15]">
      <div className="bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
            <MessageSquare className="text-green-600 dark:text-matrix-green" />
            <div>
                <h3 className="font-bold text-green-700 dark:text-matrix-green">Socratic Viva Prep</h3>
                <p className="text-xs text-gray-500">{isLiveSessionActive ? "LIVE ORAL EXAM" : "Text Chat"}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            {!isLiveSessionActive ? (
                <>
                    <button
                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            isVoiceMode 
                            ? 'bg-green-100 dark:bg-matrix-green/20 text-green-700 dark:text-matrix-green border-green-200 dark:border-matrix-green/50' 
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:text-black dark:hover:text-white'
                        }`}
                    >
                        {isVoiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        Auto-Read
                    </button>
                    <button
                        onClick={startLiveSession}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/30 animate-pulse"
                    >
                        <Mic size={14} />
                        Start Live Viva
                    </button>
                </>
            ) : (
                <button
                    onClick={stopLiveSession}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-red-600 text-white border-red-500 hover:bg-red-700"
                >
                    <MicOff size={14} />
                    End Session
                </button>
            )}
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent relative"
        style={{
            backgroundImage: 'linear-gradient(rgba(100, 100, 100, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 100, 100, 0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
        }}
      >
        {isLiveSessionActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-20">
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                     <Signal size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl text-gray-900 dark:text-white mt-4 font-bold">Listening...</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Speak naturally to your examiner.</p>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-3 max-w-[95%] md:max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-100 dark:bg-matrix-green/20 border border-green-200 dark:border-matrix-green/30'}
            `}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-green-700 dark:text-matrix-green" />}
            </div>
            <div className={`
                p-3.5 rounded-2xl text-sm leading-relaxed overflow-hidden w-full shadow-md backdrop-blur-sm
                ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700/50'}
            `}>
                {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex items-start gap-3 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-matrix-green/20 border border-green-200 dark:border-matrix-green/30 flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="text-green-700 dark:text-matrix-green animate-spin" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 py-2 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-0"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></span>
                  Evaluating response...
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-10">
        <div className="flex gap-2">
            <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isLiveSessionActive ? "Speaking enabled..." : "Type your answer... (Ask for diagrams!)"}
                className="flex-1 bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 dark:focus:border-matrix-green/50 focus:ring-1 focus:ring-green-500 dark:focus:ring-matrix-green/20 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-600 transition-all disabled:opacity-50"
                disabled={isTyping || isLiveSessionActive}
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isLiveSessionActive}
                className="bg-green-100 hover:bg-green-200 dark:bg-matrix-green/20 dark:hover:bg-matrix-green/30 text-green-700 dark:text-matrix-green p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 border border-green-200 dark:border-matrix-green/30"
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};