// AI Quiz Generator - Backend API integration

interface AIQuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface AIQuizConfig {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  questionCount: number;
  questions: AIQuizQuestion[];
  createdAt: string;
  source: string;
}

interface GenerateQuizParams {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userInterests?: string[];
}

export class AIQuizGenerator {
  private backendUrl: string;

  constructor() {
    // Use backend URL from environment variable or fallback to localhost
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    // console.log('🔗 AI Quiz Generator using backend:', this.backendUrl);
  }

  async generateQuiz(params: GenerateQuizParams): Promise<AIQuizConfig> {
    try {
      console.log('🤖 Requesting AI quiz generation from backend...');
      
      const response = await fetch(`${this.backendUrl}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: params.topic,
          difficulty: params.difficulty
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      console.log('✅ AI quiz generated successfully');
      
      // Transform backend3 response to match expected format
      const quiz = data.quiz;
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        topic: quiz.topic,
        questionCount: quiz.questionCount,
        questions: quiz.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation
        })),
        createdAt: quiz.createdAt,
        source: 'ai-generated-groq'
      };
    } catch (error) {
      console.error('❌ Failed to generate AI quiz:', error);
      throw error;
    }
  }

  // UTF-8 safe base64 encoding
  private utf8ToBase64(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
  }

  // UTF-8 safe base64 decoding
  private base64ToUtf8(str: string): string {
    return decodeURIComponent(atob(str).split('').map(
      c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  }

  // Generate quiz URL with base64 encoded data
  generateQuizUrl(quizConfig: AIQuizConfig): string {
    const encodedQuiz = this.utf8ToBase64(JSON.stringify(quizConfig));
    return `/quiz-game?quiz=ai-custom&data=${encodedQuiz}`;
  }

  // Decode quiz data from URL
  static decodeQuizFromUrl(encodedData: string): AIQuizConfig {
    try {
      // Create temporary instance to access base64ToUtf8 method
      const generator = new AIQuizGenerator();
      const decodedData = generator.base64ToUtf8(encodedData);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Failed to decode quiz data:', error);
      throw new Error('Invalid quiz data format');
    }
  }
}

// Export a singleton instance
export const aiQuizGenerator = new AIQuizGenerator();

