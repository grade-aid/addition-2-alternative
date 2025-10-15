import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { CheckCircle, RotateCcw, ArrowRight, Eye, PenTool, Play, Pause, SkipForward, Zap } from 'lucide-react';
import { PizzaGame } from './PizzaGame';

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
  const [phase, setPhase] = useState<'examples' | 'practice' | 'pizza-game' | 'earnings-calculation'>('examples');
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
  
  // Pizza game tracking
  const [correctAnswerCount, setCorrectAnswerCount] = useState(0);
  const [day1Earnings, setDay1Earnings] = useState(0);
  const [day2Earnings, setDay2Earnings] = useState(0);
  const [showEarningsCalculation, setShowEarningsCalculation] = useState(false);

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

  // Generate a question with no carrying required (for first example)
  const generateNoCarryQuestion = useCallback((): Question => {
    // Create 3-digit numbers where each column sum is < 10
    let topDigits: number[] = [];
    let bottomDigits: number[] = [];
    
    // Generate 3 digits for top number (ensuring first digit is not 0)
    topDigits[0] = Math.floor(Math.random() * 4) + 1; // 1-4
    topDigits[1] = Math.floor(Math.random() * 5); // 0-4
    topDigits[2] = Math.floor(Math.random() * 5); // 0-4
    
    // Generate bottom number digits ensuring no carry
    bottomDigits[0] = Math.floor(Math.random() * (9 - topDigits[0])) + 1; // Ensure sum < 10
    bottomDigits[1] = Math.floor(Math.random() * (10 - topDigits[1])); // Ensure sum < 10
    bottomDigits[2] = Math.floor(Math.random() * (10 - topDigits[2])); // Ensure sum < 10
    
    const topNum = topDigits.join('');
    const bottomNum = bottomDigits.join('');
    
    return {
      topNumber: topNum,
      bottomNumber: bottomNum,
      difficulty: 'easy'
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
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const exampleQuestions = difficulties.map((diff, index) => {
      if (index === 0) {
        // First example: ensure no carrying by using numbers that don't require it
        return generateNoCarryQuestion();
      }
      return generateQuestion(diff);
    });
    const solvedExamples = exampleQuestions.map(q => solveQuestion(q));
    
    setExamples(solvedExamples);
    
    // Generate 6 practice questions: 3 cycles of 2 questions each
    const practice = [
      // Cycle 1: 3-digit numbers (easy)
      generateQuestion('easy'),
      generateQuestion('easy'),
      // Cycle 2: 4-digit numbers (medium)
      generateQuestion('medium'),
      generateQuestion('medium'),
      // Cycle 3: 5-digit numbers (hard)
      generateQuestion('hard'),
      generateQuestion('hard'),
    ];
    
    setPracticeQuestions(practice);
    
    // Initialize user inputs for first practice question
    if (practice[0]) {
      const maxLength = Math.max(practice[0].topNumber.length, practice[0].bottomNumber.length);
      setUserInputs({
        answer: new Array(maxLength + 1).fill(''),
        carries: new Array(maxLength + 1).fill('')
      });
    }
  }, [generateQuestion, generateNoCarryQuestion, solveQuestion]);

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

  const completeExample = () => {
    const currentExample = examples[exampleIndex];
    if (currentExample) {
      setCurrentStep(currentExample.steps.length - 1);
      setIsAutoPlaying(false);
    }
  };

  const completePractice = () => {
    const currentQuestion = practiceQuestions[practiceIndex];
    if (!currentQuestion) return;
    
    const solved = solveQuestion(currentQuestion);
    setUserInputs({
      answer: solved.correctAnswer,
      carries: solved.correctCarries
    });
  };

  const handleInputChange = (type: 'answer' | 'carries', index: number, value: string) => {
    if (value === '' || /^\d$/.test(value)) {
      setUserInputs(prev => {
        // Determine required array length based on current context
        let requiredLength: number;
        if (phase === 'earnings-calculation') {
          requiredLength = Math.max(day1Earnings.toString().length, day2Earnings.toString().length) + 1;
        } else {
          const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
          requiredLength = type === 'answer' ? maxLength + 1 : maxLength;
        }
        
        // Create array with proper length, preserving existing values
        const currentArray = [...prev[type]];
        while (currentArray.length < requiredLength) {
          currentArray.push('');
        }
        
        // Update the specific index
        currentArray[index] = value;
        
        return {
          ...prev,
          [type]: currentArray
        };
      });
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
    
    const correct = answerCorrect && carriesCorrect;
    setIsCorrect(correct);
    
    // Track correct answers for pizza game trigger
    if (correct) {
      setCorrectAnswerCount(prev => {
        const newCount = prev + 1;
        // Trigger pizza game every 2 correct answers
        if (newCount % 2 === 0 && newCount > 0) {
          setTimeout(() => setPhase('pizza-game'), 1500);
        }
        return newCount;
      });
      
      // Auto advance to next question after a short delay
      setTimeout(() => {
        if (practiceIndex < practiceQuestions.length - 1) {
          nextPractice();
        }
      }, 1500);
    }
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

  const handleEarningsCalculation = () => {
    const total = day1Earnings + day2Earnings;
    const maxLength = Math.max(day1Earnings.toString().length, day2Earnings.toString().length);
    
    // Initialize user inputs for earnings calculation
    setUserInputs({
      answer: new Array(maxLength + 1).fill(''),
      carries: new Array(maxLength + 1).fill('')
    });
    setIsCorrect(null);
  };

  const checkEarningsAnswer = () => {
    const total = day1Earnings + day2Earnings;
    const totalStr = total.toString();
    const maxLength = Math.max(day1Earnings.toString().length, day2Earnings.toString().length) + 1;
    
    // Create the correct answer array (right-aligned)
    const correctAnswer = new Array(maxLength).fill('');
    const paddedTotal = totalStr.padStart(maxLength, ' ');
    for (let i = 0; i < maxLength; i++) {
      if (paddedTotal[i] && paddedTotal[i].trim()) {
        correctAnswer[i] = paddedTotal[i];
      }
    }
    
    // Compare user answer with correct answer
    const answerCorrect = userInputs.answer.every((val, i) => val === correctAnswer[i]);
    setIsCorrect(answerCorrect);
  };

  const handlePizzaGameComplete = (day1: number, day2: number) => {
    setDay1Earnings(day1);
    setDay2Earnings(day2);
    setPhase('earnings-calculation');
    setShowEarningsCalculation(true);
  };

  // Initialize earnings calculation when entering that phase
  useEffect(() => {
    if (phase === 'earnings-calculation' && showEarningsCalculation) {
      handleEarningsCalculation();
    }
  }, [phase, showEarningsCalculation, day1Earnings, day2Earnings]);

  const handlePizzaGameClose = () => {
    setPhase('practice');
  };

  const continuePractice = () => {
    // Reset all input states for fresh start
    setUserInputs({ answer: [], carries: [] });
    setIsCorrect(null);
    
    setPhase('practice');
    setShowEarningsCalculation(false);
    
    // Check if all 6 questions are complete (after 3rd earnings calculation)
    if (practiceIndex >= practiceQuestions.length - 1) {
      // All cycles complete!
      setPhase('complete' as any);
    }
  };



  // Get current question based on phase
  const currentQuestion = phase === 'examples' ? examples[exampleIndex] : practiceQuestions[practiceIndex];
  
  // Show pizza game
  if (phase === 'pizza-game') {
    return <PizzaGame onComplete={handlePizzaGameComplete} onClose={handlePizzaGameClose} />;
  }

  // Show completion screen
  if (phase === 'complete' as any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl p-12 text-center">
          <div className="space-y-6">
            <div className="text-8xl">🎉</div>
            <h1 className="font-display text-5xl font-bold text-brand-black">
              Congratulations!
            </h1>
            <p className="text-2xl text-muted-foreground">
              You've completed all 3 cycles of column addition practice!
            </p>
            <div className="grid grid-cols-3 gap-6 mt-8 mb-8">
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="text-4xl mb-2">✓</div>
                <h3 className="text-xl font-bold text-green-700">Cycle 1</h3>
                <p className="text-green-600">3-digit numbers</p>
              </Card>
              <Card className="p-6 bg-yellow-50 border-yellow-200">
                <div className="text-4xl mb-2">✓</div>
                <h3 className="text-xl font-bold text-yellow-700">Cycle 2</h3>
                <p className="text-yellow-600">4-digit numbers</p>
              </Card>
              <Card className="p-6 bg-red-50 border-red-200">
                <div className="text-4xl mb-2">✓</div>
                <h3 className="text-xl font-bold text-red-700">Cycle 3</h3>
                <p className="text-red-600">5-digit numbers</p>
              </Card>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="grade-button accent text-xl px-12 py-6"
            >
              Practice Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show earnings calculation
  if (phase === 'earnings-calculation' && showEarningsCalculation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl p-8">
          <div className="text-center space-y-8">
            <h1 className="font-display text-4xl font-bold text-brand-black mb-2">
              🎉 Restaurant Earnings Calculator
            </h1>
            <p className="text-xl text-muted-foreground">
              Let's use column addition to calculate your total earnings!
            </p>

            {/* Earnings Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-2xl font-bold text-blue-700 mb-4">Day 1 Earnings</h3>
                <p className="text-4xl font-bold text-blue-800">${day1Earnings}</p>
              </Card>
              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="text-2xl font-bold text-green-700 mb-4">Day 2 Earnings</h3>
                <p className="text-4xl font-bold text-green-800">${day2Earnings}</p>
              </Card>
            </div>

            {/* Column Addition Calculation */}
            <div className="bg-white rounded-3xl p-8 border-4 border-brand-black/10">
              <h3 className="text-2xl font-bold mb-6">Calculate Total Earnings:</h3>
              
              <div className="flex flex-col items-center space-y-6">
                {/* Interactive Column Addition */}
                <div className="bg-gray-50 p-8 rounded-2xl">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Carry row */}
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-mono mr-2 invisible">$</span>
                      {Array.from({ length: Math.max(day1Earnings.toString().length, day2Earnings.toString().length) + 1 }, (_, i) => (
                        <div key={i} className="w-12 h-12 flex items-center justify-center">
                          <Input
                            type="text"
                            maxLength={1}
                            className="w-10 h-10 text-center text-sm bg-red-50 border border-red-200 text-red-700 font-bold p-0 rounded"
                            placeholder=""
                            value={userInputs.carries[i] || ''}
                            onChange={(e) => handleInputChange('carries', i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* First number (Day 1) */}
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-mono mr-2">$</span>
                      {day1Earnings.toString().padStart(Math.max(day1Earnings.toString().length, day2Earnings.toString().length), ' ').split('').map((digit, i) => (
                        <div key={i} className="w-12 h-12 flex items-center justify-center text-2xl font-mono font-bold border-b-2 border-gray-300">
                          {digit.trim() && digit}
                        </div>
                      ))}
                    </div>
                    
                    {/* Second number (Day 2) with plus sign */}
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-mono mr-2">+$</span>
                      {day2Earnings.toString().padStart(Math.max(day1Earnings.toString().length, day2Earnings.toString().length), ' ').split('').map((digit, i) => (
                        <div key={i} className="w-12 h-12 flex items-center justify-center text-2xl font-mono font-bold border-b-2 border-gray-300">
                          {digit.trim() && digit}
                        </div>
                      ))}
                    </div>
                    
                    {/* Line separator */}
                    <div className="w-full h-1 bg-brand-black/20 rounded-full"></div>
                    
                    {/* Answer row */}
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-mono mr-2">$</span>
                      {Array.from({ length: Math.max(day1Earnings.toString().length, day2Earnings.toString().length) + 1 }, (_, i) => (
                        <div key={i} className="w-12 h-12 flex items-center justify-center border-2 border-primary/30 rounded-lg bg-white">
                          <Input
                            type="text"
                            maxLength={1}
                            className="w-full h-full text-center text-2xl font-mono font-bold border-none bg-transparent p-0"
                            placeholder=""
                            value={userInputs.answer[i] || ''}
                            onChange={(e) => handleInputChange('answer', i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button onClick={checkEarningsAnswer} className="grade-button primary">
                    Check Answer
                  </Button>
                </div>
                
                {/* Feedback */}
                {isCorrect !== null && (
                  <div className={`p-6 rounded-2xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isCorrect ? (
                      <h4 className="text-xl font-bold text-green-700">Perfect</h4>
                    ) : (
                      <>
                        <h4 className="text-xl font-bold text-red-700 mb-2">Not quite right</h4>
                        <p className="text-lg text-red-600">
                          Check your work and try again. Remember to work from right to left and carry when needed!
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={continuePractice} 
              className="grade-button accent text-lg px-8 py-4"
              disabled={isCorrect !== true}
            >
              Continue Practice <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
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
                    Example {exampleIndex + 1}/3
                  </span>
                </>
              ) : (
                <>
                  <span className="px-4 py-2 bg-primary/10 rounded-full font-medium flex items-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Cycle {Math.floor(practiceIndex / 2) + 1}/3 - Question {(practiceIndex % 2) + 1}/2
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
          <div className="flex justify-center gap-4 flex-wrap">
            {phase === 'examples' ? (
              <>
                {currentStep < (examples[exampleIndex]?.steps.length || 0) - 1 ? (
                  <>
                    <Button 
                      onClick={startAutoPlay} 
                      className="grade-button"
                      disabled={isAutoPlaying}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {currentStep === -1 ? 'Play Example' : 'Playing...'}
                    </Button>
                  </>
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
                Array.from({ length: 3 }, (_, i) => (
                  <div 
                    key={`progress-${i}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i <= exampleIndex ? 'bg-accent' : 'bg-border-gray'
                    }`}
                  />
                ))
              ) : (
                Array.from({ length: 6 }, (_, i) => (
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