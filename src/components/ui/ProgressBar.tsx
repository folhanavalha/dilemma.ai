import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // de 0 a 100
  children?: React.ReactNode;
}

export function ProgressBar({ value, children }: ProgressBarProps) {
  return (
    <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5 }}
        style={{ borderRadius: 999 }}
      />
      <div className="absolute inset-0 flex items-center justify-center z-10 font-bold text-white drop-shadow text-base select-none">
        {children}
      </div>
    </div>
  );
} 