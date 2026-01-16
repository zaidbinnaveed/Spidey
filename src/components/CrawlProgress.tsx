import { motion } from "framer-motion";
import { Loader2, Globe, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SpiderLogo from "./SpiderLogo";

interface CrawlProgressProps {
  status: "idle" | "crawling" | "complete" | "error";
  progress: number;
  currentUrl?: string;
  pagesFound?: number;
  error?: string;
}

const CrawlProgress = ({
  status,
  progress,
  currentUrl,
  pagesFound = 0,
  error,
}: CrawlProgressProps) => {
  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === "crawling" && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <SpiderLogo size="lg" />
            </motion.div>
          )}
          {status === "complete" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <XCircle className="w-20 h-20 text-destructive" />
            </motion.div>
          )}
        </div>

        {/* Status Text */}
        <h2 className="font-display text-3xl text-center mb-2 tracking-wider">
          {status === "crawling" && "Web Crawling in Progress"}
          {status === "complete" && "Crawl Complete!"}
          {status === "error" && "Crawl Failed"}
        </h2>

        {/* Progress Bar */}
        {status === "crawling" && (
          <div className="space-y-4 mb-6">
            <Progress
              value={progress}
              className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              <span>{pagesFound} pages found</span>
            </div>
          </div>
        )}

        {/* Current URL */}
        {status === "crawling" && currentUrl && (
          <motion.div
            key={currentUrl}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg overflow-hidden"
          >
            <Globe className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {currentUrl}
            </span>
            <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto flex-shrink-0" />
          </motion.div>
        )}

        {/* Success Stats */}
        {status === "complete" && (
          <p className="text-center text-muted-foreground">
            Successfully crawled <span className="text-primary font-semibold">{pagesFound}</span> pages
          </p>
        )}

        {/* Error Message */}
        {status === "error" && error && (
          <p className="text-center text-destructive text-sm">{error}</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CrawlProgress;
