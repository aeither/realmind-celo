import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAccount } from 'wagmi';
import { aiQuizGenerator } from '../libs/aiQuizGenerator';
import { toast } from 'sonner';

interface AIQuizGeneratorProps {
  className?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', icon: '📚' },
  { value: 'advanced', label: 'Advanced', icon: '🚀' }
] as const;

// Fixed to 3 questions - no longer configurable
const FIXED_QUESTION_COUNT = 3;

const POPULAR_TOPICS = [
  'Bitcoin Fundamentals',
  'Ethereum & Smart Contracts', 
  'DeFi Protocols',
  'NFTs & Digital Art',
  'Cryptocurrency Trading',
  'Blockchain Security',
  'Layer 2 Solutions',
  'Staking & Yield Farming',
  'Web3 Development',
  'Crypto Regulations'
];

export default function AIQuizGenerator({ className = '' }: AIQuizGeneratorProps) {
  const navigate = useNavigate();
  const { chain } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<{
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    userInterests: string[];
  }>({
    topic: '',
    difficulty: 'intermediate',
    userInterests: []
  });

  const handleTopicSelect = (topic: string) => {
    setFormData(prev => ({ ...prev, topic }));
  };

  const handleGenerateQuiz = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic for your quiz');
      return;
    }

    setIsGenerating(true);
    
    try {
      toast.info('🤖 AI is creating your personalized quiz...', {
        duration: 3000
      });

      const quizConfig = await aiQuizGenerator.generateQuiz({
        topic: formData.topic,
        difficulty: formData.difficulty,
        userInterests: formData.userInterests
      });

      const quizUrl = aiQuizGenerator.generateQuizUrl(quizConfig);
      
      toast.success('🎉 Your AI quiz is ready!');
      
      // Navigate to the generated quiz using the safe URL generation
      navigate({ to: quizUrl });
      
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl mr-3">🤖</span>
              <h2 className="text-2xl font-bold text-foreground">AI Quiz Generator</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Generate personalized quizzes on any topic using AI!
            </p>
            <button
              onClick={() => setIsOpen(true)}
              disabled={!chain}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                !chain 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-xl cursor-pointer'
              }`}
            >
              {!chain ? '🔗 Connect Wallet First' : '🎯 Create Custom Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-4xl mx-auto shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <span className="text-3xl mr-3">🤖</span>
            <h2 className="text-2xl font-bold text-gray-900">Create AI Quiz</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quiz Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Enter any topic (e.g., 'Bitcoin for beginners', 'Advanced DeFi strategies')"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all duration-200"
            />
            
            {/* Popular Topics */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3 font-medium">Popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className="px-3 py-2 bg-gray-50 hover:bg-purple-50 text-sm rounded-lg 
                               border border-gray-200 hover:border-purple-300 transition-all duration-200
                               hover:shadow-sm"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center ${
                    formData.difficulty === option.value
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-xs text-center leading-tight">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-6">
            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || !formData.topic.trim() || !chain}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                isGenerating || !formData.topic.trim() || !chain
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-[1.02]'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Generating Quiz...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  Generate AI Quiz
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
