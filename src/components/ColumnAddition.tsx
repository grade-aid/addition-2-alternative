import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface ColumnAdditionProps {
  className?: string;
}

interface Question {
  topNumber: string;
  bottomNumber: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const ColumnAddition: React.FC<ColumnAdditionProps> = ({ className = '' }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [activeColumn, setActiveColumn] = useState<number>(-1);
  const [answer, setAnswer] = useState<string[]>([]);
  const [carries, setCarries] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Question generation based on difficulty
  const generateQuestion = useCallback((difficulty: 'easy' | 'medium' | 'hard'): Question => {
    let topNum: number, bottomNum: number;
    
    switch (difficulty) {
      case 'easy':
        // 2-3 digit numbers, minimal carrying
        topNum = Math.floor(Math.random() * 900) + 100; // 100-999
        bottomNum = Math.floor(Math.random() * 90) + 10;  // 10-99
        break;
      case 'medium':
        // 3-4 digit numbers, moderate carrying
        topNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        bottomNum = Math.floor(Math.random() * 900) + 100;  // 100-999
        break;
      case 'hard':
        // 4-5 digit numbers, lots of carrying
        topNum = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
        bottomNum = Math.floor(Math.random() * 9000) + 1000;  // 1000-9999
        break;
    }
    
    return {
      topNumber: topNum.toString(),
      bottomNumber: bottomNum.toString(),
      difficulty
    };
  }, []);

  // Get difficulty based on question number
  const getCurrentDifficulty = useCallback((questionNum: number): 'easy' | 'medium' | 'hard' => {
    if (questionNum <= 3) return 'easy';
    if (questionNum <= 6) return 'medium';
    return 'hard';
  }, []);

  // Generate new question
  const generateNewQuestion = useCallback(() => {
    const difficulty = getCurrentDifficulty(questionNumber);
    const question = generateQuestion(difficulty);
    setCurrentQuestion(question);
    
    // Reset calculation state
    const maxLength = Math.max(question.topNumber.length, question.bottomNumber.length);
    setAnswer(new Array(maxLength + 1).fill(''));
    setCarries(new Array(maxLength + 1).fill(''));
    setActiveColumn(-1);
    setCurrentStep(0);
    setIsComplete(false);
  }, [questionNumber, getCurrentDifficulty, generateQuestion]);

  // Initialize with first question
  useEffect(() => {
    generateNewQuestion();
  }, []);

  const startCalculation = useCallback(() => {
    if (!currentQuestion) return;
    
    // Start from LEFT (index 0) instead of right
    setActiveColumn(0);
  }, [currentQuestion]);

  const resetCalculation = useCallback(() => {
    if (!currentQuestion) return;
    
    const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
    setAnswer(new Array(maxLength + 1).fill(''));
    setCarries(new Array(maxLength + 1).fill(''));
    setActiveColumn(-1);
    setCurrentStep(0);
    setIsComplete(false);
  }, [currentQuestion]);

  // LEFT-TO-RIGHT calculation logic
  const calculateColumn = useCallback((columnIndex: number) => {
    if (!currentQuestion) return;
    
    const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
    const paddedTop = currentQuestion.topNumber.padStart(maxLength, ' ');
    const paddedBottom = currentQuestion.bottomNumber.padStart(maxLength, ' ');
    
    if (columnIndex < 0 || columnIndex >= maxLength) return;

    const topDigit = parseInt(paddedTop[columnIndex] || '0') || 0;
    const bottomDigit = parseInt(paddedBottom[columnIndex] || '0') || 0;
    const carryIn = parseInt(carries[columnIndex] || '0') || 0;
    
    const sum = topDigit + bottomDigit + carryIn;
    const digit = sum % 10;
    const carry = Math.floor(sum / 10);

    const newAnswer = [...answer];
    const newCarries = [...carries];
    
    newAnswer[columnIndex] = digit.toString();
    if (carry > 0 && columnIndex < maxLength - 1) {
      newCarries[columnIndex + 1] = carry.toString();
    } else if (carry > 0) {
      // Final carry goes to the leftmost position
      newAnswer[maxLength] = carry.toString();
    }

    setAnswer(newAnswer);
    setCarries(newCarries);

    // Move to next column (LEFT to RIGHT)
    if (columnIndex < maxLength - 1) {
      setActiveColumn(columnIndex + 1);
      setCurrentStep(prev => prev + 1);
    } else {
      setActiveColumn(-1);
      setIsComplete(true);
    }
  }, [currentQuestion, carries, answer]);

  const handleColumnClick = (columnIndex: number) => {
    if (columnIndex === activeColumn) {
      calculateColumn(columnIndex);
    }
  };

  const nextQuestion = useCallback(() => {
    setQuestionNumber(prev => prev + 1);
    generateNewQuestion();
  }, [generateNewQuestion]);

  if (!currentQuestion) return null;

  const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
  const paddedTop = currentQuestion.topNumber.padStart(maxLength, ' ');
  const paddedBottom = currentQuestion.bottomNumber.padStart(maxLength, ' ');

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${className}`}>
      <Card className="grade-card w-full max-w-2xl">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-black mb-2">
              Column Addition Practice
            </h1>
            <div className="flex items-center justify-center gap-4 text-xl">
              <span className="px-4 py-2 bg-primary/10 rounded-full font-medium">
                Question {questionNumber}
              </span>
              <span className={`px-4 py-2 rounded-full font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="text-lg text-muted-foreground mt-2">
              Solve LEFT to RIGHT • Click each column to calculate
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={startCalculation}
              className="grade-button"
              disabled={activeColumn !== -1 || isComplete}
            >
              Start Solving
            </Button>
            <Button 
              onClick={resetCalculation}
              className="grade-button secondary"
              disabled={activeColumn === -1 && !isComplete}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
            {isComplete && (
              <Button 
                onClick={nextQuestion}
                className="grade-button accent"
              >
                Next Question <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>

          {/* Calculation Area */}
          <div className="bg-white rounded-3xl p-8 border-4 border-brand-black/10">
            <div className="flex flex-col items-center space-y-6">
              
              {/* Carry Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: maxLength + 1 }, (_, i) => (
                    <div key={`carry-${i}`} className="flex justify-center" style={{ width: '48px' }}>
                      {carries[i] && (
                        <div className="carry-box">
                          {carries[i]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Number Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div style={{ width: '48px' }}></div> {/* Spacer for alignment */}
                  {paddedTop.split('').map((digit, index) => (
                    <div 
                      key={`top-${index}`}
                      className={`digit-box ${activeColumn === index ? 'active' : ''}`}
                    >
                      {digit.trim() || ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Number Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl font-bold">
                    +
                  </div>
                  {paddedBottom.split('').map((digit, index) => (
                    <div 
                      key={`bottom-${index}`}
                      className={`digit-box ${activeColumn === index ? 'active' : ''}`}
                    >
                      {digit.trim() || ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Line */}
              <div className="w-full h-1 bg-brand-black/20 rounded-full"></div>

              {/* Answer Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: maxLength + 1 }, (_, i) => (
                    <div 
                      key={`answer-${i}`}
                      className={`digit-box cursor-pointer hover:shadow-lg transition-all duration-200 ${
                        activeColumn === i ? 'active animate-bounce-gentle' : ''
                      }`}
                      onClick={() => handleColumnClick(i)}
                      style={{ 
                        cursor: activeColumn === i ? 'pointer' : 'default'
                      }}
                    >
                      {answer[i] || ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center mt-6">
                {activeColumn >= 0 && (
                  <p className="text-lg font-medium text-primary animate-bounce-gentle">
                    Click the highlighted column to calculate: Column {activeColumn + 1} (LEFT to RIGHT)
                  </p>
                )}
                {isComplete && (
                  <div className="flex items-center justify-center gap-2 text-secondary text-xl font-bold">
                    <CheckCircle className="w-6 h-6" />
                    Great job! Ready for the next question? 🎉
                  </div>
                )}
                {activeColumn === -1 && !isComplete && (
                  <p className="text-lg font-medium text-muted-foreground">
                    Click "Start Solving" to begin!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {maxLength > 0 && (
            <div className="flex justify-center">
              <div className="flex gap-2">
                {Array.from({ length: maxLength }, (_, i) => (
                  <div 
                    key={`progress-${i}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentStep > i ? 'bg-secondary' : 'bg-border-gray'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};