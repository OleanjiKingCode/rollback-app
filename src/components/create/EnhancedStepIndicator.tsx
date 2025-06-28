import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface EnhancedStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Omit<Step, "number" | "isCompleted" | "isActive">[];
  className?: string;
}

export function EnhancedStepIndicator({
  currentStep,
  totalSteps,
  steps,
  className = "",
}: EnhancedStepIndicatorProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const enhancedSteps: Step[] = steps.map((step, index) => ({
    ...step,
    number: index + 1,
    isCompleted: index + 1 < currentStep,
    isActive: index + 1 === currentStep,
  }));

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 rounded-full transform -translate-y-1/2">
          <div
            className="h-full bg-gradient-to-r from-rollback-primary to-rollback-secondary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {enhancedSteps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 transform hover:scale-105 relative z-10
                  ${
                    step.isCompleted
                      ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                      : step.isActive
                      ? "bg-gradient-to-br from-rollback-primary to-rollback-secondary text-white ring-4 ring-rollback-primary/30 animate-pulse"
                      : "bg-white border-2 border-gray-300 text-gray-400"
                  }
                `}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-24">
                <div
                  className={`text-xs font-medium ${
                    step.isActive
                      ? "text-rollback-primary"
                      : step.isCompleted
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Details */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {enhancedSteps[currentStep - 1]?.title}
        </h2>
        <p className="text-gray-600 text-base">
          {enhancedSteps[currentStep - 1]?.description}
        </p>
        <div className="text-sm text-gray-500 mt-2">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
    </div>
  );
}
