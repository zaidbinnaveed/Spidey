import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, History, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SpiderLogo from "./SpiderLogo";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onHistoryClick?: () => void;
}

const Header = ({ isAuthenticated = false, onLogout, onHistoryClick }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <SpiderLogo size="sm" />
            <span className="font-display text-2xl tracking-widest text-gradient">
              SPIDEY
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  onClick={onHistoryClick}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onHistoryClick?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onLogout?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
