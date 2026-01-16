import { motion } from "framer-motion";

interface SpiderLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SpiderLogo = ({ className = "", size = "md" }: SpiderLogoProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-32 h-32",
  };

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`${sizes[size]} ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Spider body */}
      <ellipse cx="50" cy="55" rx="12" ry="16" fill="hsl(0, 70%, 35%)" />
      <ellipse cx="50" cy="38" rx="8" ry="10" fill="hsl(0, 70%, 35%)" />
      
      {/* Spider legs - left side */}
      <motion.path
        d="M42 45 Q25 35 15 20"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.path
        d="M40 50 Q20 45 5 40"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      />
      <motion.path
        d="M40 58 Q20 60 5 65"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
      <motion.path
        d="M42 65 Q25 75 15 90"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
      
      {/* Spider legs - right side */}
      <motion.path
        d="M58 45 Q75 35 85 20"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.path
        d="M60 50 Q80 45 95 40"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      />
      <motion.path
        d="M60 58 Q80 60 95 65"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
      <motion.path
        d="M58 65 Q75 75 85 90"
        stroke="hsl(0, 70%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
    </motion.svg>
  );
};

export default SpiderLogo;
