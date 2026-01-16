import { motion } from "framer-motion";
import { ArrowDown, Zap, Shield, Globe } from "lucide-react";
import SpiderLogo from "./SpiderLogo";

interface HeroSectionProps {
  onScrollToForm: () => void;
}

const HeroSection = ({ onScrollToForm }: HeroSectionProps) => {
  const features = [
    { icon: Globe, label: "Multi-depth Crawling" },
    { icon: Zap, label: "Real-time Progress" },
    { icon: Shield, label: "Robots.txt Compliant" },
  ];

  return (
    <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-20">
      {/* Animated Spider */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
        className="mb-6"
      >
        <SpiderLogo size="lg" className="animate-pulse-glow" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="font-display text-6xl md:text-8xl lg:text-9xl tracking-widest mb-4"
      >
        <span className="text-gradient">SPIDEY</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8"
      >
        Your friendly neighborhood web crawler. Extract links, text, images, and metadata from any website.
      </motion.p>

      {/* Feature Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="flex flex-wrap justify-center gap-4 mb-12"
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-muted-foreground"
          >
            <feature.icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{feature.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        onClick={onScrollToForm}
        className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <span className="text-sm uppercase tracking-wider">Start Crawling</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Decorative web line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute top-0 left-1/2 w-px h-20 bg-gradient-to-b from-transparent via-primary/30 to-transparent origin-top"
      />
    </section>
  );
};

export default HeroSection;
