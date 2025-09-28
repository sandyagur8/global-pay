'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { CheckCircle, Globe, Zap } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  steps?: string[];
  currentStep?: number;
}

export function LoadingModal({ 
  isOpen, 
  title = "Processing...", 
  description = "Please wait while we process your request.",
  steps = [],
  currentStep = 0
}: LoadingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4">
          {/* Loading Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="relative">
              <LoadingSpinner className="w-16 h-16 text-blue-600" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full"
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-900 mb-2 text-center"
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 text-center mb-6"
          >
            {description}
          </motion.p>

          {/* Steps */}
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-3"
            >
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-green-50 border border-green-200'
                      : index === currentStep
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : index === currentStep ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <LoadingSpinner className="w-5 h-5 text-blue-600" />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      index < currentStep
                        ? 'text-green-800 font-medium'
                        : index === currentStep
                        ? 'text-blue-800 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <p className="text-xs text-yellow-800 text-center">
              ⚠️ Please don't close this window or refresh the page
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Specialized ENS Loading Modal
export function ENSLoadingModal({ isOpen }: { isOpen: boolean }) {
  const steps = [
    "Deploying organization contract",
    "Generating ENS commitment",
    "Submitting commitment to blockchain",
    "Waiting for commitment confirmation",
    "Registering ENS domain",
    "Transferring domain ownership",
    "Finalizing setup"
  ];

  return (
    <LoadingModal
      isOpen={isOpen}
      title="Setting Up Your Organization"
      description="We're deploying your smart contract and registering your ENS domain. This may take a few minutes."
      steps={steps}
      currentStep={2} // This would be dynamic in real implementation
    />
  );
}
