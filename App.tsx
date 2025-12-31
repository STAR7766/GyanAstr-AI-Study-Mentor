import React, { useState, useRef, useEffect } from 'react';
import { analyzeLecture } from './services/gemini';
import { AnalysisResult, AppState } from './types';
import { InputSection } from './components/InputSection';
import { AlchemySection } from './components/AlchemySection';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { FlashcardDeck } from './components/FlashcardDeck';
import { VivaSection } from './components/VivaSection';
import { VisualsGenerator } from './components/VisualsGenerator';
import { downloadTextFile, exportToPng, exportToPdf, exportToWord, exportFlashcardsToPdf } from './services/exportUtils';
import { LayoutDashboard, Network, Layers, MessageSquare, ChevronLeft, ChevronRight, Download, FileText, Image as ImageIcon, FileType, Palette, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [originalText, setOriginalText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'alchemy' | 'graph' | 'flashcards' | 'viva' | 'visuals'>('alchemy');
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Persist input tab selection
  const [currentInputTab, setCurrentInputTab] = useState<'text' | 'pdf' | 'youtube'>('text');

  const [graphSvg, setGraphSvg] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Apply Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAnalyze = async (input: string | { data: string; mimeType: string }) => {
    setAppState(AppState.ANALYZING);
    if (typeof input === 'string') {
        setOriginalText(input); 
    } else {
        setOriginalText("Content derived from uploaded file (Image/PDF).");
    }

    try {
      const result = await analyzeLecture(input);
      setData(result);
      setAppState(AppState.COMPLETE);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setData(null);
    setOriginalText('');
    setGraphSvg(null);
    setActiveTab('alchemy');
  };

  const handleExportPDF = () => {
    if (activeTab !== 'alchemy') {
        setActiveTab('alchemy');
        setTimeout(() => {
            exportToPdf('alchemy-notes-container', 'GyanAstr_Handwritten_Notes.pdf');
        }, 500); 
    } else {
        exportToPdf('alchemy-notes-container', 'GyanAstr_Handwritten_Notes.pdf');
    }
    setShowExportMenu(false);
  };

  const handleExportDoc = () => {
      if (!data) return;
      exportToWord(data.alchemy, 'GyanAstr_Notes.doc');
      setShowExportMenu(false);
  };
  
  const handleExportFlashcardsPdf = () => {
    if (!data) return;
    exportFlashcardsToPdf(data.flashcards, 'GyanAstr_Flashcards.pdf');
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen study-grid-bg transition-colors duration-300">
        
        {/* Header */}
        {appState === AppState.COMPLETE && (
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-space-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={resetApp} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white" title="New Analysis">
                        <ChevronLeft />
                    </button>
                    <h1 className="hidden md:block font-bold text-xl text-gray-800 dark:text-gray-100 tracking-tight">GyanAstr</h1>
                </div>
                
                {/* Navigation Tabs */}
                <div className="relative mx-2 md:mx-0 max-w-[50vw] md:max-w-none group">
                    <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
                        <TabButton active={activeTab === 'alchemy'} onClick={() => setActiveTab('alchemy')} icon={<LayoutDashboard size={16} />} label="Alchemy" />
                        <TabButton active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} icon={<Network size={16} />} label="Mind Map" />
                        <TabButton active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} icon={<Palette size={16} />} label="Visuals" />
                        <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Layers size={16} />} label="Flashcards" />
                        <TabButton active={activeTab === 'viva'} onClick={() => setActiveTab('viva')} icon={<MessageSquare size={16} />} label="Viva/Test" />
                    </div>
                    {/* Swipe Indicator (Visible only on mobile) */}
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 dark:from-space-black/90 to-transparent pointer-events-none md:hidden flex items-center justify-end pr-1 animate-pulse">
                        <ChevronRight size={16} className="text-neon-cyan/80" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                        title="Toggle Theme"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="relative" ref={exportMenuRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${showExportMenu ? 'bg-gray-100 dark:bg-gray-800 border-neon-cyan/50 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                        >
                            <Download size={16} />
                            <span className="hidden md:inline">Export</span>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 space-y-1">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Documents</div>
                                    <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-lg transition-colors text-left group">
                                        <FileType size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <div className="font-medium">Handwritten PDF</div>
                                            <div className="text-[10px] text-gray-500">4K Notes (Alchemy)</div>
                                        </div>
                                    </button>
                                    <button onClick={handleExportDoc} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-lg transition-colors text-left group">
                                        <FileText size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <div className="font-medium">Word Document</div>
                                            <div className="text-[10px] text-gray-500">Editable text</div>
                                        </div>
                                    </button>
                                    
                                    <div className="px-3 py-1.5 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-t border-gray-200 dark:border-gray-800">Study Aids</div>
                                    <button onClick={handleExportFlashcardsPdf} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-lg transition-colors text-left group">
                                        <Layers size={16} className="text-yellow-500 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <div className="font-medium">Flashcards PDF</div>
                                            <div className="text-[10px] text-gray-500">Printable cards</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        )}

        <main className={`relative ${appState === AppState.COMPLETE ? 'pt-24 pb-12' : ''}`}>
            {appState === AppState.IDLE && (
                <InputSection 
                    onAnalyze={handleAnalyze} 
                    isLoading={false} 
                    activeTab={currentInputTab}
                    onTabChange={setCurrentInputTab}
                />
            )}

            {appState === AppState.ANALYZING && (
                <InputSection 
                    onAnalyze={() => {}} 
                    isLoading={true} 
                    activeTab={currentInputTab}
                    onTabChange={setCurrentInputTab}
                />
            )}

            {appState === AppState.ERROR && (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="text-red-500 text-xl font-mono mb-4">SYSTEM_FAILURE: Neural Link Broken</div>
                    <button onClick={resetApp} className="px-6 py-2 bg-red-900/10 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-500 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                        RETRY CONNECTION
                    </button>
                </div>
            )}

            {appState === AppState.COMPLETE && data && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className={activeTab === 'alchemy' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                        <AlchemySection data={data.alchemy} />
                    </div>

                    <div className={activeTab === 'graph' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                        <KnowledgeGraph mermaidCode={data.mermaidCode} onRender={setGraphSvg} isDarkMode={darkMode} />
                    </div>

                    <div className={activeTab === 'visuals' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                        <VisualsGenerator />
                    </div>

                    <div className={activeTab === 'flashcards' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                        <FlashcardDeck cards={data.flashcards} />
                    </div>

                    <div className={activeTab === 'viva' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                        <VivaSection initialQuestion={data.vivaQuestion} contextText={originalText} />
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; mobile?: boolean }> = ({ active, onClick, icon, label, mobile }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap
            ${active 
                ? 'bg-white dark:bg-white/10 text-neon-cyan dark:text-neon-cyan border border-neon-cyan/30 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-white/5'}
            ${mobile ? 'flex-shrink-0 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50' : ''}
        `}
    >
        {icon}
        {label}
    </button>
);

export default App;