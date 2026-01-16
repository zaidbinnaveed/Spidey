import { motion } from "framer-motion";

const WebBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Web pattern overlay */}
      <div className="absolute inset-0 web-pattern opacity-30" />
      
      {/* Animated web strands */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="webGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 15%, 25%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(0, 70%, 35%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(220, 15%, 25%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Diagonal web lines */}
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`diagonal-${i}`}
            x1={`${i * 15}%`}
            y1="0%"
            x2={`${100 - i * 10}%`}
            y2="100%"
            stroke="url(#webGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ delay: i * 0.1, duration: 1.5 }}
          />
        ))}
        
        {/* Horizontal web lines */}
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={`horizontal-${i}`}
            x1="0%"
            y1={`${20 + i * 15}%`}
            x2="100%"
            y2={`${20 + i * 15}%`}
            stroke="url(#webGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.2 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
          />
        ))}
      </svg>
      
      {/* Corner web decorations */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M0,0 Q100,50 200,200 M0,0 Q50,100 200,200 M0,0 L200,200"
            stroke="hsl(0, 70%, 35%)"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <circle cx="0" cy="0" r="5" fill="hsl(0, 70%, 35%)" opacity="0.5" />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-0 right-0 w-64 h-64 rotate-180"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M0,0 Q100,50 200,200 M0,0 Q50,100 200,200 M0,0 L200,200"
            stroke="hsl(0, 70%, 35%)"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default WebBackground;
