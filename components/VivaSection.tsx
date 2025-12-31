import React, { useState } from 'react';
import { VivaChat } from './VivaChat';
import { TestMode } from './TestMode';
import { MessageSquare, CheckSquare } from 'lucide-react';

interface VivaSectionProps {
  initialQuestion: string;
  contextText: string;
}

export const VivaSection: React.FC<VivaSectionProps> = ({ initialQuestion, contextText }) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'test'>('chat');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        {/* Sub-navigation */}
        <div className="flex justify-center">
            <div className="bg-gray-900/80 p-1 rounded-xl border border-gray-800 inline-flex">
                <button
                    onClick={() => setActiveSubTab('chat')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'chat' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageSquare size={16} /> Viva Chat
                </button>
                <button
                    onClick={() => setActiveSubTab('test')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'test' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <CheckSquare size={16} /> MCQ Test
                </button>
            </div>
        </div>

        <div className="min-h-[600px]">
            {activeSubTab === 'chat' ? (
                <VivaChat initialQuestion={initialQuestion} />
            ) : (
                <TestMode contextText={contextText} />
            )}
        </div>
    </div>
  );
};