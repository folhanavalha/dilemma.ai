import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const variants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, variant = "primary", className = "", ...props }, ref) => (
    <motion.button
      ref={ref}
      className={`px-4 py-2 rounded-2xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      whileTap={{ scale: 0.97 }}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Carregando...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
);
Button.displayName = "Button"; 