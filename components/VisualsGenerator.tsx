import React, { useState } from 'react';
import { generateStudyImage } from '../services/gemini';
import { Image as ImageIcon, Download, Ratio, Sparkles, Loader2 } from 'lucide-react';

export const VisualsGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
        const url = await generateStudyImage(prompt, aspectRatio);
        setImageUrl(url);
    } catch (e) {
        console.error(e);
        alert("Failed to generate image.");
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (imageUrl) {
          const a = document.createElement('a');
          a.href = imageUrl;
          a.download = `GyanAstr-Visual-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                <ImageIcon className="text-pink-600 dark:text-pink-400" size={24} />
                <h3 className="text-2xl font-bold text-pink-600 dark:text-pink-400">Visual Aids Generator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">Describe the diagram or concept</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A cross-section of a jet engine, labeled engineering diagram style..."
                            className="w-full h-32 bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-gray-200 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2 flex items-center gap-2">
                            <Ratio size={14} /> Aspect Ratio
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {['1:1', '16:9', '4:3', '3:4'].map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                        aspectRatio === ratio 
                                        ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-300' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className={`
                            w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${loading || !prompt 
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.02]'}
                        `}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        {loading ? 'Generating...' : 'Generate Visual'}
                    </button>
                </div>

                <div className="flex items-center justify-center bg-gray-100 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[300px] relative overflow-hidden group">
                    {imageUrl ? (
                        <>
                            <img src={imageUrl} alt="Generated visual" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={handleDownload}
                                    className="bg-white text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Download size={16} /> Download PNG
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-400 dark:text-gray-500">
                            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Preview area</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};