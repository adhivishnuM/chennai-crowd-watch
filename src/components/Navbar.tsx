import { useState, useEffect } from 'react'; // React hooks import
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Menu, X, Landmark, Bus, Clock, Bell } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { useMode } from '@/context/ModeContext';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { NavLink } from './NavLink';

export function Navbar() {
  const { mode } = useMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg leading-none">Crowdex</span>
                  <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/80 text-[10px] font-mono font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {timeString}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">
                  Know Before You Go
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Center - Navigation (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink to="/" end className="px-4 py-2 rounded-lg text-sm font-medium">Map</NavLink>
            <NavLink to="/transport" className="px-4 py-2 rounded-lg text-sm font-medium">Transport</NavLink>
            <NavLink to="/best-times" className="px-4 py-2 rounded-lg text-sm font-medium">Best Times</NavLink>
            <NavLink to="/alerts" className="px-4 py-2 rounded-lg text-sm font-medium">Alerts</NavLink>
          </div>

          {/* Right - Search & Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <ModeToggle />
            </div>

            {mode === 'public' && (
              <motion.div
                className="relative hidden sm:block"
                initial={false}
                animate={{ width: searchOpen ? 250 : 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {searchOpen ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-9 pr-9 bg-secondary/50"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setSearchOpen(false)}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="lg:hidden py-4 border-t border-border/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-4 items-center">
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  <NavLink to="/" end className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Map</NavLink>
                  <NavLink to="/transport" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Transport</NavLink>
                  <NavLink to="/best-times" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Best Times</NavLink>
                  <NavLink to="/alerts" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Alerts</NavLink>
                </div>
                <ModeToggle />
                {mode === 'public' && (
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
