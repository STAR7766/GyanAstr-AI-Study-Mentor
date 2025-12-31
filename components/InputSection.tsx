import React, { useRef, useState } from 'react';
import { Sparkles, Youtube, AlignLeft, FileText, Paperclip, X, File, Camera, Image as ImageIcon, GraduationCap, Bot, User, BookOpen, Calculator, BrainCircuit, ScanLine, Ruler, Mic, StopCircle } from 'lucide-react';
import { transcribeAudio } from '../services/gemini';

interface InputSectionProps {
  onAnalyze: (input: string | { data: string; mimeType: string }) => void;
  isLoading: boolean;
  activeTab: 'text' | 'pdf' | 'youtube';
  onTabChange: (tab: 'text' | 'pdf' | 'youtube') => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading, activeTab, onTabChange }) => {
  const [text, setText] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; data: string; mimeType: string } | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedFile({
          name: file.name,
          data: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                setIsTranscribing(true);
                try {
                    const transcript = await transcribeAudio(base64Audio, 'audio/mp3');
                    setText(prev => (prev ? prev + "\n" + transcript : transcript));
                } catch (e) {
                    console.error("Transcription failed", e);
                    alert("Failed to transcribe audio.");
                } finally {
                    setIsTranscribing(false);
                }
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (e) {
        console.error("Mic access denied", e);
        alert("Please enable microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'text' || activeTab === 'pdf') {
      if (uploadedFile) {
        onAnalyze({ data: uploadedFile.data, mimeType: uploadedFile.mimeType });
      } else if (text.trim()) {
        onAnalyze(text);
      }
    } else if (activeTab === 'youtube' && youtubeUrl.trim()) {
      onAnalyze(youtubeUrl);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh] relative overflow-hidden">
      
      {/* --- ANIMATED BACKGROUND SCENE --- */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-20 left-[5%] md:left-[10%] opacity-10 animate-pulse-slow">
             <GraduationCap size={60} className="absolute -top-8 -right-4 text-neon-cyan rotate-12" />
             <Bot size={140} className="text-gray-300 dark:text-gray-700 opacity-20 dark:opacity-40" />
          </div>
          <div className="absolute bottom-20 right-[5%] md:right-[10%] opacity-10 animate-bounce" style={{ animationDuration: '4s' }}>
             <User size={120} className="text-gray-300 dark:text-gray-700 opacity-20 dark:opacity-40" />
             <BookOpen size={50} className="absolute bottom-0 -left-6 text-plasma-purple -rotate-12" />
          </div>
          <Calculator size={40} className="absolute top-1/4 right-[20%] text-gray-400 dark:text-gray-600 opacity-20 animate-spin-slow" style={{ animationDuration: '10s' }} />
          <BrainCircuit size={40} className="absolute bottom-1/3 left-[15%] text-gray-400 dark:text-gray-600 opacity-20 animate-pulse" />
          <Ruler size={40} className="absolute top-1/3 left-[30%] text-gray-400 dark:text-gray-600 opacity-20 rotate-45" />
      </div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-blue-500 to-plasma-purple mb-4 drop-shadow-sm pb-1">
          GyanAstr
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto font-medium tracking-wide">
          Your AI Arsenal for Academic Victory
        </p>
      </div>

      <div className="w-full bg-white/60 dark:bg-space-black/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden relative group z-20">
         <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-plasma-purple/5 pointer-events-none"></div>
         
         <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <button 
                onClick={() => onTabChange('text')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap px-4 ${activeTab === 'text' ? 'bg-gray-100/50 dark:bg-gray-800/50 text-neon-cyan border-b-2 border-neon-cyan' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
            >
                <ScanLine size={18} /> Universal Solver
            </button>
            <button 
                onClick={() => onTabChange('pdf')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap px-4 ${activeTab === 'pdf' ? 'bg-gray-100/50 dark:bg-gray-800/50 text-plasma-purple border-b-2 border-plasma-purple' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
            >
                <FileText size={18} /> Notes Converter
            </button>
            <button 
                onClick={() => onTabChange('youtube')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap px-4 ${activeTab === 'youtube' ? 'bg-gray-100/50 dark:bg-gray-800/50 text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
            >
                <Youtube size={18} /> YouTube Link
            </button>
         </div>

         <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {activeTab === 'text' && (
                <div className="space-y-4">
                    {!uploadedFile && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.1)] group/btn">
                                <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full group-hover/btn:bg-neon-cyan/20 transition-colors">
                                    <Camera size={20} className="text-gray-700 dark:text-neon-cyan" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300">Camera</span>
                            </button>

                            <input type="file" ref={imageInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(96,165,250,0.1)] group/btn">
                                <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full group-hover/btn:bg-blue-500/20 transition-colors">
                                    <ImageIcon size={20} className="text-gray-700 dark:text-blue-400" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300">Gallery</span>
                            </button>

                            <input type="file" ref={pdfInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf" />
                            <button type="button" onClick={() => pdfInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:border-red-400/50 hover:shadow-[0_0_15px_rgba(248,113,113,0.1)] group/btn">
                                <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full group-hover/btn:bg-red-500/20 transition-colors">
                                    <FileText size={20} className="text-gray-700 dark:text-red-400" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300">Upload PDF</span>
                            </button>
                            
                            <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border rounded-xl transition-all hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] group/btn ${isRecording ? 'border-red-500 animate-pulse' : 'border-gray-200 dark:border-gray-700 hover:border-yellow-400/50'}`}>
                                <div className={`p-2 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors ${isRecording ? 'bg-red-100 dark:bg-red-900/50' : 'group-hover/btn:bg-yellow-500/20'}`}>
                                    {isRecording ? <StopCircle size={20} className="text-red-500" /> : <Mic size={20} className="text-gray-700 dark:text-yellow-400" />}
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium ${isRecording ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{isRecording ? 'Stop' : 'Voice Input'}</span>
                            </button>
                        </div>
                    )}

                    <div className="relative">
                        {!uploadedFile ? (
                            <div className="relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={isTranscribing ? "Listening and transcribing..." : "Type, paste problem, or use voice input..."}
                                    className="w-full h-40 bg-gray-50 dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 p-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 resize-none font-mono text-sm leading-relaxed transition-all placeholder-gray-400 dark:placeholder-gray-600"
                                    disabled={isLoading || isTranscribing}
                                />
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center gap-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 border-dashed rounded-xl animate-in fade-in zoom-in-95">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700 shadow-lg">
                                        {uploadedFile.mimeType.includes('image') ? (
                                            <ImageIcon size={32} className="text-neon-cyan" />
                                        ) : (
                                            <FileText size={32} className="text-red-400" />
                                        )}
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-medium text-lg mb-1 max-w-xs truncate px-4">{uploadedFile.name}</h3>
                                    <p className="text-gray-500 text-sm">Ready to analyze</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
                                >
                                    <X size={16} /> Remove File
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'pdf' && (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                     {!uploadedFile ? (
                        <div 
                            onClick={() => pdfInputRef.current?.click()}
                            className="w-full h-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-plasma-purple hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all group"
                        >
                            <input type="file" ref={pdfInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf, text/plain" />
                            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <Paperclip size={32} className="text-plasma-purple" />
                            </div>
                            <h3 className="text-gray-600 dark:text-gray-300 font-medium">Click to Upload Lecture PDF</h3>
                            <p className="text-gray-500 text-sm mt-2">Converts to handwritten-style summary</p>
                        </div>
                     ) : (
                        <div className="text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-plasma-purple/50">
                                <FileText size={32} className="text-plasma-purple" />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-medium text-lg mb-4">{uploadedFile.name}</h3>
                            <button
                                type="button"
                                onClick={clearFile}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 mx-auto"
                            >
                                <X size={16} /> Remove
                            </button>
                        </div>
                     )}
                </div>
            )}

            {activeTab === 'youtube' && (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                    <div className="w-full max-w-lg">
                        <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2 ml-1">YouTube Video URL</label>
                        <div className="relative flex items-center">
                            <Youtube className="absolute left-4 text-red-500" />
                            <input 
                                type="text" 
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 max-w-md text-center">
                        GyanAstr will look for transcripts to generate structured notes.
                    </p>
                </div>
            )}

            <div className="flex justify-end mt-6">
                <button
                type="submit"
                disabled={isLoading || ((activeTab === 'text' || activeTab === 'pdf') ? (!text.trim() && !uploadedFile) : !youtubeUrl.trim())}
                className={`
                    flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg w-full md:w-auto justify-center
                    ${isLoading 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : activeTab === 'youtube' 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95'
                        : activeTab === 'pdf'
                            ? 'bg-gradient-to-r from-plasma-purple to-purple-600 text-white hover:shadow-[0_0_20px_rgba(189,0,255,0.4)] hover:scale-105 active:scale-95'
                            : 'bg-gradient-to-r from-neon-cyan to-blue-600 text-white dark:text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:scale-105 active:scale-95'
                    }
                `}
                >
                {isLoading ? (
                    <>
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                    </>
                ) : (
                    <>
                    <Sparkles size={20} />
                    {activeTab === 'youtube' 
                        ? 'Get Structured Summary' 
                        : activeTab === 'pdf' 
                            ? 'Convert to Handwritten Notes' 
                            : 'Solve & Explain'
                    }
                    </>
                )}
                </button>
            </div>
         </form>
      </div>
    </div>
  );
};