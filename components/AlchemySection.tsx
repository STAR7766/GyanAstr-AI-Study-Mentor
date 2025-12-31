import React, { useState } from 'react';
import { AlchemyData } from '../types';
import { Beaker, Zap, Globe, AlertTriangle, PenTool } from 'lucide-react';

interface AlchemySectionProps {
  data: AlchemyData;
}

export const AlchemySection: React.FC<AlchemySectionProps> = ({ data }) => {
  const [isHandwritten, setIsHandwritten] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-end">
        <button 
            onClick={() => setIsHandwritten(!isHandwritten)}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isHandwritten 
                    ? 'bg-ink-blue text-paper-bg ring-2 ring-ink-blue ring-offset-2 ring-offset-white dark:ring-offset-gray-900' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}
            `}
        >
            <PenTool size={16} />
            {isHandwritten ? 'View Digital' : 'View Handwritten'}
        </button>
      </div>
      
      {/* Printable Area ID for PDF export */}
      <div id="alchemy-notes-container" className={`
        transition-all duration-500 ease-in-out
        ${isHandwritten ? 'p-8 bg-paper-bg text-ink-blue font-hand shadow-xl rounded-sm' : ''}
      `}>
          {/* Summary Section */}
          <div className={`
            mb-8
            ${isHandwritten ? 'bg-transparent border-b-2 border-gray-300 pb-6' : 'bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 backdrop-blur-sm'}
          `}>
            <h3 className={`flex items-center gap-3 text-2xl font-bold mb-6 ${isHandwritten ? 'text-ink-blue' : 'text-neon-cyan dark:text-neon-cyan'}`}>
              <Beaker className={isHandwritten ? 'text-ink-blue' : 'text-neon-cyan'} />
              Core Topics
            </h3>
            <ul className={`space-y-3 ${isHandwritten ? 'bg-lined-paper leading-8' : ''}`}>
              {data.summaryPoints.map((point, idx) => (
                <li key={idx} className={`flex items-start gap-3 ${isHandwritten ? 'text-xl' : 'text-gray-700 dark:text-gray-300'}`}>
                  <span className={`mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 ${isHandwritten ? 'bg-ink-blue' : 'bg-neon-cyan'}`} />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`grid md:grid-cols-2 gap-6 ${isHandwritten ? 'block space-y-8 md:space-y-0' : ''}`}>
            {/* Exam Alerts */}
            <div className={`
                ${isHandwritten ? 'bg-red-50 border-2 border-red-200 rounded-lg p-6 rotate-1' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6'}
            `}>
              <h3 className={`flex items-center gap-3 text-xl font-bold mb-4 ${isHandwritten ? 'text-red-700' : 'text-red-600 dark:text-red-400'}`}>
                <AlertTriangle className={isHandwritten ? 'text-red-700' : 'text-red-500 dark:text-red-400'} />
                Exam Alerts
              </h3>
              <ul className="space-y-3">
                {data.examAlerts.map((alert, idx) => (
                  <li key={idx} className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${isHandwritten ? 'text-red-800 bg-transparent border-b border-red-100 text-lg' : 'text-red-800 dark:text-red-100 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30'}
                  `}>
                    <Zap size={16} className={isHandwritten ? 'text-red-600' : 'text-red-500 dark:text-red-400 shrink-0'} />
                    <span className={isHandwritten ? 'font-hand font-bold' : 'font-mono text-sm'}>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Real World Connection */}
            <div className={`
                ${isHandwritten ? 'bg-green-50 border-2 border-green-200 rounded-lg p-6 -rotate-1' : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6'}
            `}>
              <h3 className={`flex items-center gap-3 text-xl font-bold mb-4 ${isHandwritten ? 'text-emerald-800' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <Globe className={isHandwritten ? 'text-emerald-800' : 'text-emerald-500 dark:text-emerald-400'} />
                Real-World Connection
              </h3>
              <p className={`leading-relaxed italic ${isHandwritten ? 'text-emerald-900 text-lg' : 'text-emerald-800 dark:text-emerald-100'}`}>
                "{data.realWorldConnection}"
              </p>
            </div>
          </div>
      </div>
    </div>
  );
};