import React, { useEffect, useRef, useState } from 'react';
import { Network, Image as ImageIcon } from 'lucide-react';
import { exportToPng } from '../services/exportUtils';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface KnowledgeGraphProps {
  mermaidCode: string;
  onRender?: (svg: string) => void;
  variant?: 'default' | 'chat';
  isDarkMode?: boolean;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ mermaidCode, onRender, variant = 'default', isDarkMode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (window.mermaid) {
        try {
          // Initialize with theme based on isDarkMode
          window.mermaid.initialize({
            startOnLoad: false,
            theme: isDarkMode ? 'dark' : 'default',
            securityLevel: 'loose',
            fontFamily: 'Fira Code',
            flowchart: { htmlLabels: false }
          });
          
          let cleanCode = mermaidCode
            .replace(/```mermaid/g, '')
            .replace(/```/g, '')
            .trim();
            
          if (!cleanCode.startsWith('graph') && !cleanCode.startsWith('flowchart') && !cleanCode.startsWith('sequenceDiagram') && !cleanCode.startsWith('classDiagram')) {
             cleanCode = 'graph TD\n' + cleanCode;
          }

          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await window.mermaid.render(id, cleanCode);
          setSvgContent(svg);
          setError(null);
          
          if (onRender) {
            onRender(svg);
          }
        } catch (err: any) {
          console.error('Mermaid render error:', err);
          setError(`Could not render graph. Syntax might be invalid.\nDetails: ${err.message || err}`);
        }
      } else {
        setError('Mermaid library not loaded.');
      }
    };

    renderDiagram();
  }, [mermaidCode, onRender, isDarkMode]);

  const handleDownloadPNG = () => {
    if (svgContent) {
      exportToPng(svgContent, 'GyanAstr_Diagram.png');
    }
  };

  // Render variant for Chat
  if (variant === 'chat') {
      return (
          <div className="my-3 w-full max-w-full overflow-x-auto bg-white dark:bg-[#0b0c15] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
             {error ? (
                 <div className="text-red-500 dark:text-red-400 text-xs font-mono p-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 rounded">
                     Diagram Error: {error}
                 </div>
             ) : !svgContent ? (
                 <div className="flex items-center gap-2 text-xs text-neon-cyan animate-pulse">
                     <Network size={14} /> Generating diagram...
                 </div>
             ) : (
                 <div 
                    ref={containerRef}
                    className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: svgContent }} 
                 />
             )}
          </div>
      );
  }

  // Default Render (Mind Map Tab)
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
      <div className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-1 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60">
            <div className="flex items-center gap-3">
                <Network className="text-plasma-purple" />
                <h3 className="text-xl font-bold text-plasma-purple">Visual Mind Map</h3>
            </div>
            {!error && svgContent && (
                <button 
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                    title="Download as PNG"
                >
                    <ImageIcon size={14} />
                    <span>Save PNG</span>
                </button>
            )}
        </div>
        
        <div className={`p-8 overflow-x-auto flex justify-center min-h-[400px] ${isDarkMode ? 'bg-[#0b0c15]' : 'bg-white'}`}>
          {error ? (
             <div className="text-red-500 dark:text-red-400 font-mono p-4 border border-red-200 dark:border-red-900 rounded bg-red-50 dark:bg-red-950/30 w-full overflow-auto">
                <div className="mb-2 font-bold">Render Error</div>
                <div className="text-sm mb-4">{error}</div>
                <div className="text-xs text-gray-500 uppercase mb-1">Raw Code</div>
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-100 dark:bg-black/30 p-2 rounded">{mermaidCode}</pre>
             </div>
          ) : (
            <div 
                ref={containerRef}
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};