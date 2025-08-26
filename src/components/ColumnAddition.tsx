import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface ColumnAdditionProps {
  className?: string;
}

export const ColumnAddition: React.FC<ColumnAdditionProps> = ({ className = '' }) => {
  const [topNumber, setTopNumber] = useState('');
  const [bottomNumber, setBottomNumber] = useState('');
  const [activeColumn, setActiveColumn] = useState<number>(-1);
  const [answer, setAnswer] = useState<string[]>([]);
  const [carries, setCarries] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const maxLength = Math.max(topNumber.length, bottomNumber.length);
  
  const paddedTop = topNumber.padStart(maxLength, ' ');
  const paddedBottom = bottomNumber.padStart(maxLength, ' ');

  const resetCalculation = useCallback(() => {
    setAnswer(new Array(maxLength + 1).fill(''));
    setCarries(new Array(maxLength + 1).fill(''));
    setActiveColumn(-1);
    setCurrentStep(0);
    setIsComplete(false);
  }, [maxLength]);

  const startCalculation = useCallback(() => {
    if (!topNumber || !bottomNumber) return;
    
    resetCalculation();
    setActiveColumn(maxLength - 1);
  }, [topNumber, bottomNumber, maxLength, resetCalculation]);

  const calculateColumn = useCallback((columnIndex: number) => {
    if (columnIndex < 0 || columnIndex >= maxLength) return;

    const topDigit = parseInt(paddedTop[columnIndex] || '0') || 0;
    const bottomDigit = parseInt(paddedBottom[columnIndex] || '0') || 0;
    const carryIn = parseInt(carries[columnIndex + 1] || '0') || 0;
    
    const sum = topDigit + bottomDigit + carryIn;
    const digit = sum % 10;
    const carry = Math.floor(sum / 10);

    const newAnswer = [...answer];
    const newCarries = [...carries];
    
    newAnswer[columnIndex + 1] = digit.toString();
    if (carry > 0) {
      newCarries[columnIndex] = carry.toString();
    }

    setAnswer(newAnswer);
    setCarries(newCarries);

    // Move to next column
    if (columnIndex > 0) {
      setActiveColumn(columnIndex - 1);
      setCurrentStep(prev => prev + 1);
    } else {
      // Check if there's a final carry
      if (carry > 0) {
        newAnswer[0] = carry.toString();
        setAnswer(newAnswer);
      }
      setActiveColumn(-1);
      setIsComplete(true);
    }
  }, [paddedTop, paddedBottom, carries, answer, maxLength]);

  const handleColumnClick = (columnIndex: number) => {
    if (columnIndex === activeColumn) {
      calculateColumn(columnIndex);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${className}`}>
      <Card className="grade-card w-full max-w-2xl">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-black mb-2">
              Column Addition
            </h1>
            <p className="text-xl text-muted-foreground">
              Enter two numbers and solve step by step!
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-medium text-brand-black mb-2">
                  Top Number
                </label>
                <Input 
                  type="number"
                  value={topNumber}
                  onChange={(e) => setTopNumber(e.target.value)}
                  className="math-input"
                  placeholder="4545"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-brand-black mb-2">
                  Bottom Number
                </label>
                <Input 
                  type="number"
                  value={bottomNumber}
                  onChange={(e) => setBottomNumber(e.target.value)}
                  className="math-input"
                  placeholder="54545"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button 
                onClick={startCalculation}
                className={`grade-button ${!topNumber || !bottomNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!topNumber || !bottomNumber}
                title={!topNumber || !bottomNumber ? 'Please enter numbers in both fields' : 'Click to start calculation'}
              >
                Start Calculation
              </Button>
              <Button 
                onClick={resetCalculation}
                className="grade-button secondary"
                disabled={activeColumn === -1 && !isComplete}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
            
            {/* Helper text */}
            {(!topNumber || !bottomNumber) && (
              <div className="text-center">
                <p className="text-lg text-secondary font-medium">
                  📝 Please enter numbers in both fields above to start!
                </p>
              </div>
            )}
          </div>

          {/* Calculation Area */}
          {(topNumber && bottomNumber) && (
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
                          activeColumn === (maxLength - 1 - i) ? 'active animate-bounce-gentle' : ''
                        }`}
                        onClick={() => handleColumnClick(maxLength - 1 - i)}
                        style={{ 
                          cursor: activeColumn === (maxLength - 1 - i) ? 'pointer' : 'default'
                        }}
                      >
                        {answer[maxLength - i] || ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center mt-6">
                  {activeColumn >= 0 && (
                    <p className="text-lg font-medium text-primary animate-bounce-gentle">
                      Click the highlighted column to calculate: Column {maxLength - activeColumn}
                    </p>
                  )}
                  {isComplete && (
                    <div className="flex items-center justify-center gap-2 text-secondary text-xl font-bold">
                      <CheckCircle className="w-6 h-6" />
                      Calculation Complete! Well done! 🎉
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {maxLength > 0 && (
            <div className="flex justify-center">
              <div className="flex gap-2">
                {Array.from({ length: maxLength }, (_, i) => (
                  <div 
                    key={`progress-${i}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentStep > (maxLength - 1 - i) ? 'bg-secondary' : 'bg-border-gray'
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