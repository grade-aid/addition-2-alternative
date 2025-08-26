import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { CheckCircle, RotateCcw, ArrowRight, Eye, PenTool, Play, Pause, SkipForward } from 'lucide-react';

interface ColumnAdditionProps {
  className?: string;
}

interface Question {
  topNumber: string;
  bottomNumber: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SolvedExample extends Question {
  correctAnswer: string[];
  correctCarries: string[];
  steps: ExampleStep[];
}

interface ExampleStep {
  columnIndex: number;
  calculation: string;
  result: string;
  carry?: string;
  description: string;
}

interface UserInputs {
  answer: string[];
  carries: string[];
}

export const ColumnAddition: React.FC<ColumnAdditionProps> = ({ className = '' }) => {
  // Phase management
  const [phase, setPhase] = useState<'examples' | 'practice'>('examples');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  
  // Step-by-step animation for examples
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  // Data storage
  const [examples, setExamples] = useState<SolvedExample[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputs>({ answer: [], carries: [] });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

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

  // Solve a question and return the correct answer and carries
  const solveQuestion = useCallback((question: Question): SolvedExample => {
    const maxLength = Math.max(question.topNumber.length, question.bottomNumber.length);
    const paddedTop = question.topNumber.padStart(maxLength, ' ');
    const paddedBottom = question.bottomNumber.padStart(maxLength, ' ');
    
    const answer: string[] = new Array(maxLength + 1).fill('');
    const carries: string[] = new Array(maxLength + 1).fill('');
    const steps: ExampleStep[] = [];
    
    let carry = 0;
    
    // Solve from right to left and create steps
    for (let i = maxLength - 1; i >= 0; i--) {
      const topDigit = parseInt(paddedTop[i] || '0') || 0;
      const bottomDigit = parseInt(paddedBottom[i] || '0') || 0;
      const sum = topDigit + bottomDigit + carry;
      
      const columnNumber = maxLength - i;
      let calculation = `${topDigit} + ${bottomDigit}`;
      if (carry > 0) {
        calculation += ` + ${carry} (carry)`;
      }
      calculation += ` = ${sum}`;
      
      const result = (sum % 10).toString();
      const newCarry = Math.floor(sum / 10);
      
      steps.push({
        columnIndex: i,
        calculation,
        result,
        carry: newCarry > 0 ? newCarry.toString() : undefined,
        description: `Column ${columnNumber}: ${calculation}${newCarry > 0 ? `, carry ${newCarry}` : ''}`
      });
      
      answer[i] = result;
      carry = newCarry;
      
      // Store carry for next column (to the left)
      if (carry > 0 && i > 0) {
        carries[i - 1] = carry.toString();
      }
    }
    
    // Handle final carry
    if (carry > 0) {
      answer[maxLength] = carry.toString();
      steps.push({
        columnIndex: -1,
        calculation: `Final carry: ${carry}`,
        result: carry.toString(),
        description: `Write the final carry ${carry} in the leftmost position`
      });
    }
    
    return {
      ...question,
      correctAnswer: answer,
      correctCarries: carries,
      steps
    };
  }, []);

  // Initialize examples and practice questions
  useEffect(() => {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'easy', 'medium', 'medium', 'hard'];
    const exampleQuestions = difficulties.map(diff => generateQuestion(diff));
    const solvedExamples = exampleQuestions.map(q => solveQuestion(q));
    
    setExamples(solvedExamples);
    
    // Generate 10 practice questions
    const practice = Array.from({ length: 10 }, (_, i) => {
      const diffIndex = Math.floor(i / 3.3); // Distribute difficulties
      const difficulty = ['easy', 'medium', 'hard'][Math.min(diffIndex, 2)] as 'easy' | 'medium' | 'hard';
      return generateQuestion(difficulty);
    });
    
    setPracticeQuestions(practice);
    
    // Initialize user inputs for first practice question
    if (practice[0]) {
      const maxLength = Math.max(practice[0].topNumber.length, practice[0].bottomNumber.length);
      setUserInputs({
        answer: new Array(maxLength + 1).fill(''),
        carries: new Array(maxLength + 1).fill('')
      });
    }
  }, [generateQuestion, solveQuestion]);

  const nextExample = () => {
    if (exampleIndex < examples.length - 1) {
      setExampleIndex(prev => prev + 1);
      setCurrentStep(-1); // Reset to beginning of new example
      setIsAutoPlaying(false);
    }
  };

  const startPractice = () => {
    setPhase('practice');
    setPracticeIndex(0);
    setIsCorrect(null);
  };

  // Step-by-step controls for examples
  const resetSteps = () => {
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  };

  const nextStep = () => {
    const currentExample = examples[exampleIndex];
    if (currentExample && currentStep < currentExample.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const autoPlay = useCallback(() => {
    const currentExample = examples[exampleIndex];
    if (!currentExample || !isAutoPlaying) return;

    if (currentStep < currentExample.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsAutoPlaying(false);
    }
  }, [examples, exampleIndex, currentStep, isAutoPlaying]);

  // Auto-play timer
  useEffect(() => {
    if (isAutoPlaying) {
      const timer = setTimeout(autoPlay, 4000); // 4 second intervals (slower)
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isAutoPlaying]);

  const startAutoPlay = () => {
    if (currentStep === -1) {
      setCurrentStep(0);
    }
    setIsAutoPlaying(true);
  };

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
  };

  const handleInputChange = (type: 'answer' | 'carries', index: number, value: string) => {
    if (value === '' || /^\d$/.test(value)) {
      setUserInputs(prev => ({
        ...prev,
        [type]: prev[type].map((v, i) => i === index ? value : v)
      }));
      setIsCorrect(null); // Reset validation
    }
  };

  const checkAnswer = () => {
    const currentQuestion = practiceQuestions[practiceIndex];
    if (!currentQuestion) return;
    
    const solved = solveQuestion(currentQuestion);
    
    // Compare user inputs with correct answers
    const answerCorrect = userInputs.answer.every((val, i) => val === solved.correctAnswer[i]);
    const carriesCorrect = userInputs.carries.every((val, i) => val === solved.correctCarries[i]);
    
    setIsCorrect(answerCorrect && carriesCorrect);
  };

  const nextPractice = () => {
    if (practiceIndex < practiceQuestions.length - 1) {
      setPracticeIndex(prev => prev + 1);
      
      // Reset inputs for next question
      const nextQuestion = practiceQuestions[practiceIndex + 1];
      if (nextQuestion) {
        const maxLength = Math.max(nextQuestion.topNumber.length, nextQuestion.bottomNumber.length);
        setUserInputs({
          answer: new Array(maxLength + 1).fill(''),
          carries: new Array(maxLength + 1).fill('')
        });
      }
      setIsCorrect(null);
    }
  };

  // Get current question based on phase
  const currentQuestion = phase === 'examples' ? examples[exampleIndex] : practiceQuestions[practiceIndex];
  
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
              Column Addition {phase === 'examples' ? 'Examples' : 'Practice'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-xl">
              {phase === 'examples' ? (
                <>
                  <span className="px-4 py-2 bg-accent/10 rounded-full font-medium flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Example {exampleIndex + 1}/5
                  </span>
                </>
              ) : (
                <>
                  <span className="px-4 py-2 bg-primary/10 rounded-full font-medium flex items-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Question {practiceIndex + 1}/10
                  </span>
                </>
              )}
              <span className={`px-4 py-2 rounded-full font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="text-lg text-muted-foreground mt-2">
              {phase === 'examples' 
                ? 'Study the solved examples to learn the method'
                : 'Fill in the answer and carries, then check your solution'
              }
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {phase === 'examples' ? (
              <>
                {currentStep < (examples[exampleIndex]?.steps.length || 0) - 1 ? (
                  <Button 
                    onClick={startAutoPlay} 
                    className="grade-button"
                    disabled={isAutoPlaying}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {currentStep === -1 ? 'Play Example' : 'Playing...'}
                  </Button>
                ) : (
                  <>
                    {exampleIndex < examples.length - 1 ? (
                      <Button onClick={nextExample} className="grade-button">
                        Next Example <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={startPractice} className="grade-button accent">
                        Start Practice <PenTool className="w-5 h-5 ml-2" />
                      </Button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button onClick={checkAnswer} className="grade-button">
                  Check Answer
                </Button>
                {isCorrect && practiceIndex < practiceQuestions.length - 1 && (
                  <Button onClick={nextPractice} className="grade-button accent">
                    Next Question <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Calculation Area */}
          <div className="bg-white rounded-3xl p-8 border-4 border-brand-black/10">
            <div className="flex flex-col items-center space-y-6">
              
              {/* Carry Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div style={{ width: '48px' }}></div>
                  {Array.from({ length: maxLength }, (_, i) => {
                    // For examples, show carries that were generated by completed steps
                    // Carries appear above the column to the LEFT of where they were generated
                    const shouldShowCarry = phase === 'practice' || 
                      (currentStep >= 0 && (currentQuestion as SolvedExample).steps.some((step, stepIndex) => 
                        stepIndex <= currentStep && step.columnIndex === i + 1 && step.carry
                      ));
                    
                    return (
                      <div key={`carry-${i}`} className="flex justify-center" style={{ width: '48px' }}>
                        {phase === 'examples' ? (
                          // Show solved carries for examples (only if step completed)
                          shouldShowCarry && (currentQuestion as SolvedExample).correctCarries?.[i] && (
                            <div className="carry-box animate-fade-in">
                              {(currentQuestion as SolvedExample).correctCarries[i]}
                            </div>
                          )
                        ) : (
                          // Input fields for practice
                          <Input
                            type="text"
                            value={userInputs.carries[i] || ''}
                            onChange={(e) => handleInputChange('carries', i, e.target.value)}
                            className="w-8 h-8 text-center text-sm p-1 border-secondary/50 bg-secondary/10"
                            maxLength={1}
                            placeholder=""
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Number Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div style={{ width: '48px' }}></div>
                  {paddedTop.split('').map((digit, index) => {
                    // Highlight active column in examples
                    const isActive = phase === 'examples' && currentStep >= 0 && 
                      (currentQuestion as SolvedExample).steps[currentStep]?.columnIndex === index;
                    
                    return (
                      <div 
                        key={`top-${index}`} 
                        className={`digit-box transition-all duration-300 ${
                          isActive ? 'border-primary bg-primary/10 scale-105 animate-pulse' : ''
                        }`}
                      >
                        {digit.trim() || ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Number Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl font-bold">
                    +
                  </div>
                  {paddedBottom.split('').map((digit, index) => {
                    // Highlight active column in examples
                    const isActive = phase === 'examples' && currentStep >= 0 && 
                      (currentQuestion as SolvedExample).steps[currentStep]?.columnIndex === index;
                    
                    return (
                      <div 
                        key={`bottom-${index}`} 
                        className={`digit-box transition-all duration-300 ${
                          isActive ? 'border-primary bg-primary/10 scale-105 animate-pulse' : ''
                        }`}
                      >
                        {digit.trim() || ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Horizontal Line */}
              <div className="w-full h-1 bg-brand-black/20 rounded-full"></div>

              {/* Answer Row */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {/* Final carry position */}
                  <div className="flex justify-center" style={{ width: '48px' }}>
                    {phase === 'examples' ? (
                      <div 
                        className={`digit-box transition-all duration-300 ${
                          // Show final carry if it's been completed
                          currentStep >= 0 && (currentQuestion as SolvedExample).steps.some((step, stepIndex) => 
                            stepIndex <= currentStep && step.columnIndex === -1
                          ) ? 'animate-scale-in' : ''
                        }`}
                        style={{ 
                          visibility: currentStep >= 0 && (currentQuestion as SolvedExample).steps.some((step, stepIndex) => 
                            stepIndex <= currentStep && step.columnIndex === -1
                          ) && (currentQuestion as SolvedExample).correctAnswer?.[maxLength] ? 'visible' : 'hidden' 
                        }}
                      >
                        {(currentQuestion as SolvedExample).correctAnswer?.[maxLength] || ''}
                      </div>
                    ) : (
                      <Input
                        type="text"
                        value={userInputs.answer[maxLength] || ''}
                        onChange={(e) => handleInputChange('answer', maxLength, e.target.value)}
                        className="w-12 h-12 text-center font-mono font-bold p-1"
                        maxLength={1}
                        placeholder=""
                        style={{ visibility: 'visible' }}
                      />
                    )}
                  </div>
                  
                  {/* Main answer positions */}
                  {Array.from({ length: maxLength }, (_, i) => {
                    // For examples, only show answers up to current step
                    const shouldShowAnswer = phase === 'practice' || 
                      (currentStep >= 0 && (currentQuestion as SolvedExample).steps.some((step, stepIndex) => 
                        stepIndex <= currentStep && step.columnIndex === i
                      ));
                    
                    return (
                      <div key={`answer-${i}`} className="flex justify-center" style={{ width: '48px' }}>
                        {phase === 'examples' ? (
                          <div 
                            className={`digit-box transition-all duration-300 ${
                              shouldShowAnswer ? 'animate-scale-in' : ''
                            }`}
                            style={{ 
                              visibility: shouldShowAnswer ? 'visible' : 'hidden' 
                            }}
                          >
                            {shouldShowAnswer ? (currentQuestion as SolvedExample).correctAnswer?.[i] || '' : ''}
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={userInputs.answer[i] || ''}
                            onChange={(e) => handleInputChange('answer', i, e.target.value)}
                            className="w-12 h-12 text-center font-mono font-bold p-1"
                            maxLength={1}
                            placeholder=""
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              {phase === 'examples' ? (
                <div className="text-center text-muted-foreground">
                  {currentStep === -1 ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        📚 Watch the step-by-step solution
                      </p>
                    </div>
                  ) : currentStep < (examples[exampleIndex]?.steps.length || 0) - 1 ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-primary">
                        👀 Solving...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-secondary">
                        ✅ Complete!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Practice mode instructions remain the same
                <>
                  {/* Feedback */}
                  {isCorrect !== null && (
                    <div className={`text-center p-4 rounded-lg font-medium ${
                      isCorrect 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-6 h-6" />
                          Excellent! Your answer is correct! 🎉
                        </div>
                      ) : (
                        <div>
                          Not quite right. Check your carries and answer digits.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              {phase === 'examples' ? (
                Array.from({ length: 5 }, (_, i) => (
                  <div 
                    key={`progress-${i}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i <= exampleIndex ? 'bg-accent' : 'bg-border-gray'
                    }`}
                  />
                ))
              ) : (
                Array.from({ length: 10 }, (_, i) => (
                  <div 
                    key={`progress-${i}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i <= practiceIndex ? 'bg-primary' : 'bg-border-gray'
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};