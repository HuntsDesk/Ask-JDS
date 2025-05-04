import React from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
}

/**
 * A full-screen loading component
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  showSpinner = true,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center text-center p-4">
        {showSpinner && <LoadingSpinner size="lg" />}
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 