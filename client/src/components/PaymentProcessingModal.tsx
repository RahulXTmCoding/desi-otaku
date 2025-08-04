import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, CreditCard, Package, Mail } from 'lucide-react';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { 
      id: 0, 
      text: 'Verifying your payment...', 
      icon: CreditCard,
      duration: 200 
    },
    { 
      id: 1, 
      text: 'Creating your order...', 
      icon: Package,
      duration: 200 
    },
    { 
      id: 2, 
      text: 'Sending confirmation email...', 
      icon: Mail,
      duration: 200 
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsComplete(false);
      return;
    }

    const progressTimer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, steps[currentStep]?.duration || 1000);

    return () => clearTimeout(progressTimer);
  }, [isOpen, currentStep, onComplete]);

  if (!isOpen) return null;

  const CurrentIcon = steps[currentStep]?.icon || Loader2;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700">
        {isComplete ? (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Order Successful!</h3>
            <p className="text-gray-300">Redirecting to confirmation page...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CurrentIcon className="w-8 h-8 text-gray-900 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Processing Your Order</h3>
            <p className="text-gray-300 mb-6">{steps[currentStep]?.text}</p>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-2 mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      index <= currentStep
                        ? 'bg-yellow-400'
                        : 'bg-gray-600'
                    }`}
                  />
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 transition-all ${
                        index < currentStep
                          ? 'bg-yellow-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-400">Please don't close this window</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
