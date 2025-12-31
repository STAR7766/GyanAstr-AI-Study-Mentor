export interface Flashcard {
  question: string;
  answer: string;
}

export interface AlchemyData {
  summaryPoints: string[];
  examAlerts: string[];
  realWorldConnection: string;
}

export interface AnalysisResult {
  alchemy: AlchemyData;
  mermaidCode: string;
  flashcards: Flashcard[];
  vivaQuestion: string;
}

export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
}

export interface TestResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  scorePercentage: number;
  questions: TestQuestion[];
  userAnswers: Record<number, number>; // questionId -> optionIndex
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}