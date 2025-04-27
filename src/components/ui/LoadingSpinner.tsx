import React from "react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 32, className = "" }: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin border-4 border-t-transparent border-blue-600 rounded-full ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Carregando"
    />
  );
} 