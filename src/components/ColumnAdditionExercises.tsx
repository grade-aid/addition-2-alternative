import React, { useState, useCallback, useEffect } from 'react';

interface Question {
  topNumber: string;
  bottomNumber: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SolvedExample extends Question {
  correctAnswer: string[];
  correctCarries: string[];
}

interface UserInputs {
  answer: string[];
  carries: string[];
}

interface ColumnAdditionExercisesProps {
  onComplete?: () => void;
  questionCount?: number;
  className?: string;
}

export const ColumnAdditionExercises: React.FC<ColumnAdditionExercisesProps> = ({
  onComplete,
  questionCount = 6,
  className = ''
}) => {
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<UserInputs>({ answer: [], carries: [] });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  // Question generation based on difficulty
  const generateQuestion = useCallback((difficulty: 'easy' | 'medium' | 'hard'): Question => {
    let topNum: number, bottomNum: number;
    
    switch (difficulty) {
      case 'easy':
        topNum = Math.floor(Math.random() * 900) + 100; // 100-999
        bottomNum = Math.floor(Math.random() * 90) + 10;  // 10-99
        break;
      case 'medium':
        topNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        bottomNum = Math.floor(Math.random() * 900) + 100;  // 100-999
        break;
      case 'hard':
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
    
    let carry = 0;
    
    // Solve from right to left
    for (let i = maxLength - 1; i >= 0; i--) {
      const topDigit = parseInt(paddedTop[i] || '0') || 0;
      const bottomDigit = parseInt(paddedBottom[i] || '0') || 0;
      const sum = topDigit + bottomDigit + carry;
      
      answer[i] = (sum % 10).toString();
      carry = Math.floor(sum / 10);
      
      // Store carry for next column (to the left)
      if (carry > 0 && i > 0) {
        carries[i - 1] = carry.toString();
      }
    }
    
    // Handle final carry
    if (carry > 0) {
      answer[maxLength] = carry.toString();
    }
    
    return {
      ...question,
      correctAnswer: answer,
      correctCarries: carries
    };
  }, []);

  // Initialize practice questions
  useEffect(() => {
    const difficulties: ('easy' | 'medium' | 'hard')[] = [];
    const easyCount = Math.ceil(questionCount / 3);
    const mediumCount = Math.ceil(questionCount / 3);
    const hardCount = questionCount - easyCount - mediumCount;
    
    for (let i = 0; i < easyCount; i++) difficulties.push('easy');
    for (let i = 0; i < mediumCount; i++) difficulties.push('medium');
    for (let i = 0; i < hardCount; i++) difficulties.push('hard');
    
    const practice = difficulties.map(diff => generateQuestion(diff));
    setPracticeQuestions(practice);
    
    // Initialize user inputs for first question
    if (practice[0]) {
      const maxLength = Math.max(practice[0].topNumber.length, practice[0].bottomNumber.length);
      setUserInputs({
        answer: new Array(maxLength + 1).fill(''),
        carries: new Array(maxLength + 1).fill('')
      });
    }
  }, [generateQuestion, questionCount]);

  const handleInputChange = (type: 'answer' | 'carries', index: number, value: string) => {
    if (value === '' || /^\d$/.test(value)) {
      setUserInputs(prev => {
        const currentQuestion = practiceQuestions[currentIndex];
        const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
        const requiredLength = maxLength + 1;
        
        const currentArray = [...prev[type]];
        while (currentArray.length < requiredLength) {
          currentArray.push('');
        }
        
        currentArray[index] = value;
        
        return {
          ...prev,
          [type]: currentArray
        };
      });
      setIsCorrect(null);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = practiceQuestions[currentIndex];
    if (!currentQuestion) return;
    
    const solved = solveQuestion(currentQuestion);
    
    // Compare user inputs with correct answers
    const answerCorrect = userInputs.answer.every((val, i) => val === solved.correctAnswer[i]);
    const carriesCorrect = userInputs.carries.every((val, i) => val === solved.correctCarries[i]);
    
    const correct = answerCorrect && carriesCorrect;
    setIsCorrect(correct);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      
      // Auto advance after correct answer
      setTimeout(() => {
        if (currentIndex < practiceQuestions.length - 1) {
          nextQuestion();
        } else if (onComplete) {
          onComplete();
        }
      }, 1500);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Reset inputs for next question
      const nextQ = practiceQuestions[currentIndex + 1];
      if (nextQ) {
        const maxLength = Math.max(nextQ.topNumber.length, nextQ.bottomNumber.length);
        setUserInputs({
          answer: new Array(maxLength + 1).fill(''),
          carries: new Array(maxLength + 1).fill('')
        });
      }
      setIsCorrect(null);
    }
  };

  const currentQuestion = practiceQuestions[currentIndex];
  
  if (!currentQuestion) return null;

  const maxLength = Math.max(currentQuestion.topNumber.length, currentQuestion.bottomNumber.length);
  const paddedTop = currentQuestion.topNumber.padStart(maxLength, ' ');
  const paddedBottom = currentQuestion.bottomNumber.padStart(maxLength, ' ');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} className={className}>
      <div style={{ width: '100%', maxWidth: '672px', background: 'white', borderRadius: '24px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
              Column Addition Practice
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '20px' }}>
              <span style={{ 
                padding: '8px 16px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: '9999px', 
                fontWeight: '500' 
              }}>
                Question {currentIndex + 1}/{practiceQuestions.length}
              </span>
              <span style={{ 
                padding: '8px 16px',
                borderRadius: '9999px',
                fontWeight: '500',
                background: currentQuestion.difficulty === 'easy' ? '#dcfce7' : 
                           currentQuestion.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                color: currentQuestion.difficulty === 'easy' ? '#15803d' :
                       currentQuestion.difficulty === 'medium' ? '#a16207' : '#b91c1c'
              }}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '18px', color: '#6b7280', marginTop: '8px' }}>
              Fill in the answer and carries, then check your solution
            </p>
          </div>

          {/* Check Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={checkAnswer}
              style={{
                padding: '12px 32px',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              Check Answer
            </button>
          </div>

          {/* Calculation Area */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: '4px solid rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              
              {/* Carry Row */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '48px' }}></div>
                  {Array.from({ length: maxLength }, (_, i) => (
                    <div key={`carry-${i}`} style={{ display: 'flex', justifyContent: 'center', width: '48px' }}>
                      <input
                        type="text"
                        value={userInputs.carries[i] || ''}
                        onChange={(e) => handleInputChange('carries', i, e.target.value)}
                        style={{
                          width: '32px',
                          height: '32px',
                          textAlign: 'center',
                          fontSize: '14px',
                          padding: '4px',
                          border: '1px solid rgba(234, 179, 8, 0.5)',
                          background: 'rgba(234, 179, 8, 0.1)',
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                        maxLength={1}
                        placeholder=""
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Number Row */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '48px' }}></div>
                  {paddedTop.split('').map((digit, index) => (
                    <div 
                      key={`top-${index}`} 
                      style={{
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        border: '2px solid transparent',
                        borderBottom: '2px solid #d1d5db',
                        borderRadius: '8px'
                      }}
                    >
                      {digit.trim() || ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Number Row */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', fontSize: '24px', fontWeight: 'bold' }}>
                    +
                  </div>
                  {paddedBottom.split('').map((digit, index) => (
                    <div 
                      key={`bottom-${index}`} 
                      style={{
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        border: '2px solid transparent',
                        borderBottom: '2px solid #d1d5db',
                        borderRadius: '8px'
                      }}
                    >
                      {digit.trim() || ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Line */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '9999px' }}></div>

              {/* Answer Row */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Final carry position */}
                  <div style={{ display: 'flex', justifyContent: 'center', width: '48px' }}>
                    <input
                      type="text"
                      value={userInputs.answer[maxLength] || ''}
                      onChange={(e) => handleInputChange('answer', maxLength, e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        padding: '4px',
                        fontSize: '24px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      maxLength={1}
                      placeholder=""
                    />
                  </div>
                  
                  {/* Main answer positions */}
                  {Array.from({ length: maxLength }, (_, i) => (
                    <div key={`answer-${i}`} style={{ display: 'flex', justifyContent: 'center', width: '48px' }}>
                      <input
                        type="text"
                        value={userInputs.answer[i] || ''}
                        onChange={(e) => handleInputChange('answer', i, e.target.value)}
                        style={{
                          width: '48px',
                          height: '48px',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          padding: '4px',
                          fontSize: '24px',
                          border: '2px solid #3b82f6',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        maxLength={1}
                        placeholder=""
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {isCorrect !== null && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  fontWeight: '500',
                  background: isCorrect ? '#dcfce7' : '#fee2e2',
                  color: isCorrect ? '#15803d' : '#b91c1c'
                }}>
                  {isCorrect ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Excellent! Your answer is correct! 🎉
                    </div>
                  ) : (
                    <div>
                      Not quite right. Check your carries and answer digits.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array.from({ length: practiceQuestions.length }, (_, i) => (
                <div 
                  key={`progress-${i}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '9999px',
                    transition: 'all 0.3s',
                    background: i <= currentIndex ? '#3b82f6' : '#e5e7eb'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
