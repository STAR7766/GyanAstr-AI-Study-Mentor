import React, { useState } from 'react';
import { Flashcard } from '../types';
import { Layers, RotateCw, ChevronRight, ChevronLeft } from 'lucide-react';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const currentCard = cards[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
      <div className="flex items-center gap-3 mb-6">
         <Layers className="text-yellow-500 dark:text-yellow-400" />
         <h3 className="text-xl font-bold text-yellow-500 dark:text-yellow-400">Flashcards</h3>
      </div>

      <div className="relative group perspective-1000 h-80 cursor-pointer" onClick={handleFlip}>
        <div className={`
            relative w-full h-full duration-500 preserve-3d transition-transform
            ${isFlipped ? 'rotate-y-180' : ''}
        `}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden">
                <div className="w-full h-full bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-neon-cyan/50 transition-colors">
                    <span className="absolute top-4 left-4 text-xs font-mono text-gray-400 dark:text-gray-500">QUESTION {currentIndex + 1}/{cards.length}</span>
                    <h4 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{currentCard.question}</h4>
                    <p className="absolute bottom-6 text-sm text-gray-400 flex items-center gap-2">
                        <RotateCw size={14} /> Click to flip
                    </p>
                </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="w-full h-full bg-gray-50 dark:bg-gradient-to-br dark:from-gray-800 dark:to-black border-2 border-neon-cyan/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <span className="absolute top-4 left-4 text-xs font-mono text-neon-cyan">ANSWER</span>
                    <p className="text-xl text-gray-900 dark:text-white leading-relaxed">{currentCard.answer}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button 
            onClick={handlePrev}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
            <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
            {cards.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-neon-cyan' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
                />
            ))}
        </div>
        <button 
            onClick={handleNext}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
            <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};