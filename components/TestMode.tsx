import React, { useState, useEffect } from 'react';
import { generateTest } from '../services/gemini';
import { exportTestReportToPdf } from '../services/exportUtils';
import { TestQuestion, TestResult } from '../types';
import { Timer, FileText, CheckCircle, XCircle, Download, Play, BarChart } from 'lucide-react';

interface TestModeProps {
  contextText: string;
}

export const TestMode: React.FC<TestModeProps> = ({ contextText }) => {
  const [step, setStep] = useState<'setup' | 'loading' | 'active' | 'report'>('setup');
  const [numQuestions, setNumQuestions] = useState(5);
  const [useTimer, setUseTimer] = useState(true);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); 
  const [timeLeft, setTimeLeft] = useState(0);

  const handleStart = async () => {
    setStep('loading');
    try {
      const qs = await generateTest(contextText, numQuestions);
      setQuestions(qs);
      setStep('active');
      if (useTimer) {
        setTimeLeft(numQuestions * 60);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate test questions. Please try again.");
      setStep('setup');
    }
  };

  useEffect(() => {
    if (step === 'active' && useTimer && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, useTimer, timeLeft]);

  const handleSelectOption = (qId: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    setStep('report');
  };

  const getResult = (): TestResult => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) correct++;
    });
    return {
      totalQuestions: questions.length,
      attempted: Object.keys(answers).length,
      correct,
      scorePercentage: (correct / questions.length) * 100,
      questions,
      userAnswers: answers
    };
  };

  const handleDownloadReport = () => {
    exportTestReportToPdf(getResult(), 'GyanAstr_Test_Report.pdf');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (step === 'setup') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-500 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
            <div className="bg-neon-cyan/10 p-4 rounded-full">
                <FileText size={32} className="text-neon-cyan" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Test Knowledge</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Generate a custom MCQ test based on the lecture.</p>
        
        <div className="space-y-6 text-left">
            <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Number of Questions</label>
                <input 
                    type="range" min="3" max="15" value={numQuestions} 
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full accent-neon-cyan"
                />
                <div className="text-right text-neon-cyan font-mono">{numQuestions} Questions</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Timer size={20} className={useTimer ? 'text-neon-cyan' : 'text-gray-400'} />
                    <span className="text-gray-700 dark:text-gray-200">Timer Mode</span>
                </div>
                <button 
                    onClick={() => setUseTimer(!useTimer)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${useTimer ? 'bg-neon-cyan' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${useTimer ? 'translate-x-6' : ''}`} />
                </button>
            </div>

            <button 
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-neon-cyan to-blue-600 text-white dark:text-black font-bold rounded-xl hover:shadow-lg hover:shadow-neon-cyan/20 transition-all flex items-center justify-center gap-2"
            >
                <Play size={20} /> Start Test
            </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <div className="w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mb-4" />
        <p className="text-neon-cyan font-mono animate-pulse">Generating Questions...</p>
      </div>
    );
  }

  if (step === 'active') {
    const attemptedCount = Object.keys(answers).length;
    return (
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-[600px] animate-in fade-in">
        {/* Sidebar Status */}
        <div className="w-full md:w-64 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 h-fit space-y-6">
            {useTimer && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">TIME REMAINING</div>
                    <div className={`text-2xl font-mono font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-neon-cyan'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            )}
            
            <div className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total</span>
                    <span className="text-gray-900 dark:text-white font-mono">{questions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-matrix-green">Attempted</span>
                    <span className="text-gray-900 dark:text-white font-mono">{attemptedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unattempted</span>
                    <span className="text-gray-900 dark:text-white font-mono">{questions.length - attemptedCount}</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-neon-cyan h-full transition-all duration-500"
                        style={{ width: `${(attemptedCount / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <button 
                onClick={handleSubmit}
                className="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-xl transition-colors font-medium"
            >
                Submit Test
            </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 space-y-8 pb-12">
            {questions.map((q, idx) => (
                <div key={q.id} className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        <span className="text-neon-cyan font-mono mr-2">{idx + 1}.</span>
                        {q.question}
                    </h3>
                    <div className="space-y-3">
                        {q.options.map((opt, optIdx) => (
                            <button
                                key={optIdx}
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    answers[q.id] === optIdx
                                        ? 'bg-neon-cyan/10 border-neon-cyan text-blue-800 dark:text-neon-cyan'
                                        : 'bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span className="inline-block w-6 font-mono opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            
            <button 
                onClick={handleSubmit}
                className="w-full md:w-auto px-8 py-3 bg-neon-cyan text-white dark:text-black font-bold rounded-xl hover:shadow-lg hover:shadow-neon-cyan/20 transition-all mx-auto block"
            >
                Submit Answers
            </button>
        </div>
      </div>
    );
  }

  // Report Step
  if (step === 'report') {
    const result = getResult();
    return (
      <div className="animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-8 text-center relative overflow-hidden backdrop-blur-sm">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Complete</h2>
                <div className="flex justify-center items-center gap-4 my-6">
                    <div className="text-center px-6">
                        <div className="text-sm text-gray-500">SCORE</div>
                        <div className="text-4xl font-bold text-neon-cyan">{result.scorePercentage.toFixed(0)}%</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300 dark:bg-gray-700" />
                    <div className="text-center px-6">
                        <div className="text-sm text-gray-500">CORRECT</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.correct}/{result.totalQuestions}</div>
                    </div>
                </div>
                
                <button 
                    onClick={handleDownloadReport}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl transition-colors border border-gray-300 dark:border-gray-600"
                >
                    <Download size={18} /> Download Report Card (PDF)
                </button>
            </div>
            {/* Background decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-cyan/10 blur-[80px] rounded-full -z-0" />
        </div>

        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
                <BarChart size={20} /> Detailed Analysis
            </h3>
            {result.questions.map((q, idx) => {
                const userAns = result.userAnswers[q.id];
                const isCorrect = userAns === q.correctAnswerIndex;
                const skipped = userAns === undefined;

                return (
                    <div key={q.id} className={`border rounded-xl p-6 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : skipped ? 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                        <div className="flex items-start gap-3 mb-4">
                            {isCorrect ? <CheckCircle className="text-green-500 shrink-0 mt-1" /> : <XCircle className="text-red-500 shrink-0 mt-1" />}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                                    <span className="text-gray-500 mr-2">{idx+1}.</span>{q.question}
                                </h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                            {q.options.map((opt, optIdx) => {
                                const isOptCorrect = optIdx === q.correctAnswerIndex;
                                const isOptSelected = optIdx === userAns;
                                
                                let styleClass = "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900/50";
                                if (isOptCorrect) styleClass = "border-green-500/50 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                                else if (isOptSelected && !isOptCorrect) styleClass = "border-red-500/50 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300";

                                return (
                                    <div key={optIdx} className={`p-3 rounded-lg border text-sm ${styleClass}`}>
                                        <span className="font-mono opacity-50 mr-2">{String.fromCharCode(65+optIdx)}.</span> {opt}
                                        {isOptCorrect && <span className="float-right text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">Correct</span>}
                                        {isOptSelected && !isOptCorrect && <span className="float-right text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">Your Answer</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  return null;
};