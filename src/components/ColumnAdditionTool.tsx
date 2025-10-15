import React, { useState, useCallback } from 'react';

interface ColumnAdditionToolProps {
  topNumber: number;
  bottomNumber: number;
  onCorrectAnswer?: () => void;
  showPrefix?: string; // Optional prefix like "$"
  className?: string;
}

interface UserInputs {
  answer: string[];
  carries: string[];
}

interface SolvedAddition {
  correctAnswer: string[];
  correctCarries: string[];
}

export const ColumnAdditionTool: React.FC<ColumnAdditionToolProps> = ({
  topNumber,
  bottomNumber,
  onCorrectAnswer,
  showPrefix = '',
  className = ''
}) => {
  const [userInputs, setUserInputs] = useState<UserInputs>({ answer: [], carries: [] });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Solve the addition problem and return correct answer and carries
  const solveAddition = useCallback((top: number, bottom: number): SolvedAddition => {
    const topStr = top.toString();
    const bottomStr = bottom.toString();
    const maxLength = Math.max(topStr.length, bottomStr.length);
    
    const answer: string[] = new Array(maxLength + 1).fill('');
    const carries: string[] = new Array(maxLength + 1).fill('');
    
    let carry = 0;
    
    // Solve from right to left
    for (let i = maxLength - 1; i >= 0; i--) {
      const topDigit = parseInt(topStr[topStr.length - maxLength + i] || '0') || 0;
      const bottomDigit = parseInt(bottomStr[bottomStr.length - maxLength + i] || '0') || 0;
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
      correctAnswer: answer,
      correctCarries: carries
    };
  }, []);

  const handleInputChange = (type: 'answer' | 'carries', index: number, value: string) => {
    if (value === '' || /^\d$/.test(value)) {
      setUserInputs(prev => {
        const maxLength = Math.max(topNumber.toString().length, bottomNumber.toString().length);
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
    const solved = solveAddition(topNumber, bottomNumber);
    
    // Compare user inputs with correct answers
    const answerCorrect = userInputs.answer.every((val, i) => val === solved.correctAnswer[i]);
    const carriesCorrect = userInputs.carries.every((val, i) => val === solved.correctCarries[i]);
    
    const correct = answerCorrect && carriesCorrect;
    setIsCorrect(correct);
    
    if (correct && onCorrectAnswer) {
      setTimeout(() => onCorrectAnswer(), 1000);
    }
  };

  const maxLength = Math.max(topNumber.toString().length, bottomNumber.toString().length);
  const paddedTop = topNumber.toString().padStart(maxLength, ' ');
  const paddedBottom = bottomNumber.toString().padStart(maxLength, ' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }} className={className}>
      {/* Interactive Column Addition */}
      <div style={{ background: '#f9fafb', padding: '32px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Carry row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showPrefix && <span style={{ fontSize: '24px', fontFamily: 'monospace', marginRight: '8px', visibility: 'hidden' }}>{showPrefix}</span>}
            {/* Empty spacer for overflow position */}
            <div style={{ width: '48px', height: '48px' }}></div>
            {Array.from({ length: maxLength }, (_, i) => (
              <div key={i} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="text"
                  maxLength={1}
                  style={{
                    width: '40px',
                    height: '40px',
                    textAlign: 'center',
                    fontSize: '14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontWeight: 'bold',
                    padding: '0',
                    borderRadius: '4px'
                  }}
                  placeholder=""
                  value={userInputs.carries[i] || ''}
                  onChange={(e) => handleInputChange('carries', i, e.target.value)}
                />
              </div>
            ))}
          </div>
          
          {/* First number */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showPrefix && <span style={{ fontSize: '24px', fontFamily: 'monospace', marginRight: '8px' }}>{showPrefix}</span>}
            <div style={{ width: '48px', height: '48px' }}></div>
            {paddedTop.split('').map((digit, i) => (
              <div key={i} style={{ 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '24px', 
                fontFamily: 'monospace', 
                fontWeight: 'bold', 
                borderBottom: '2px solid #d1d5db' 
              }}>
                {digit.trim() && digit}
              </div>
            ))}
          </div>
          
          {/* Second number with plus sign */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showPrefix && <span style={{ fontSize: '24px', fontFamily: 'monospace', marginRight: '8px', visibility: 'hidden' }}>{showPrefix}</span>}
            <div style={{ 
              width: '48px', 
              height: '48px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px', 
              fontFamily: 'monospace', 
              fontWeight: 'bold' 
            }}>
              +
            </div>
            {paddedBottom.split('').map((digit, i) => (
              <div key={i} style={{ 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '24px', 
                fontFamily: 'monospace', 
                fontWeight: 'bold', 
                borderBottom: '2px solid #d1d5db' 
              }}>
                {digit.trim() && digit}
              </div>
            ))}
          </div>
          
          {/* Line separator */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '9999px' }}></div>
          
          {/* Answer row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showPrefix && <span style={{ fontSize: '24px', fontFamily: 'monospace', marginRight: '8px' }}>{showPrefix}</span>}
            {Array.from({ length: maxLength + 1 }, (_, i) => (
              <div key={i} style={{ 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '2px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '8px', 
                background: 'white' 
              }}>
                <input
                  type="text"
                  maxLength={1}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    border: 'none',
                    background: 'transparent',
                    padding: '0',
                    outline: 'none'
                  }}
                  placeholder=""
                  value={userInputs.answer[i] || ''}
                  onChange={(e) => handleInputChange('answer', i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Check Button */}
      <button 
        onClick={checkAnswer}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          background: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
      >
        Check Answer
      </button>
      
      {/* Feedback */}
      {isCorrect !== null && (
        <div style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          background: isCorrect ? '#dcfce7' : '#fee2e2' 
        }}>
          {isCorrect ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Perfect! ✓</h4>
            </div>
          ) : (
            <>
              <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '8px' }}>Not quite right</h4>
              <p style={{ fontSize: '18px', color: '#dc2626', margin: 0 }}>
                Check your work and try again. Remember to work from right to left and carry when needed!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
