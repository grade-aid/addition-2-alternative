import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle } from 'lucide-react';

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
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Interactive Column Addition */}
      <div className="bg-gray-50 p-8 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Carry row */}
          <div className="flex gap-2 items-center">
            {showPrefix && <span className="text-2xl font-mono mr-2 invisible">{showPrefix}</span>}
            {/* Empty spacer for overflow position */}
            <div className="w-12 h-12"></div>
            {Array.from({ length: maxLength }, (_, i) => (
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
          
          {/* First number */}
          <div className="flex gap-2 items-center">
            {showPrefix && <span className="text-2xl font-mono mr-2">{showPrefix}</span>}
            <div className="w-12 h-12"></div>
            {paddedTop.split('').map((digit, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center text-2xl font-mono font-bold border-b-2 border-gray-300">
                {digit.trim() && digit}
              </div>
            ))}
          </div>
          
          {/* Second number with plus sign */}
          <div className="flex gap-2 items-center">
            {showPrefix && <span className="text-2xl font-mono mr-2 invisible">{showPrefix}</span>}
            <div className="w-12 h-12 flex items-center justify-center text-2xl font-mono font-bold">
              +
            </div>
            {paddedBottom.split('').map((digit, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center text-2xl font-mono font-bold border-b-2 border-gray-300">
                {digit.trim() && digit}
              </div>
            ))}
          </div>
          
          {/* Line separator */}
          <div className="w-full h-1 bg-brand-black/20 rounded-full"></div>
          
          {/* Answer row */}
          <div className="flex gap-2 items-center">
            {showPrefix && <span className="text-2xl font-mono mr-2">{showPrefix}</span>}
            {Array.from({ length: maxLength + 1 }, (_, i) => (
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
      
      {/* Check Button */}
      <Button onClick={checkAnswer} className="grade-button primary">
        Check Answer
      </Button>
      
      {/* Feedback */}
      {isCorrect !== null && (
        <div className={`p-6 rounded-2xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-6 h-6" />
              <h4 className="text-xl font-bold">Perfect! ✓</h4>
            </div>
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
  );
};
