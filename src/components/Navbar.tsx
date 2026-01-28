import { useState, useEffect } from 'react'; // React hooks import
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Menu, X, Landmark, Bus, Clock, Bell, ChevronRight } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { useMode } from '@/context/ModeContext';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { NavLink } from './NavLink';
import { chennaiLocations } from '@/data/mockLocations';

export function Navbar() {
  const { mode } = useMode();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof chennaiLocations[number][]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter results when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = chennaiLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.type.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 results
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleResultClick = (id: string) => {
    navigate(`/location/${id}`);
    setSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleLogoClick = () => {
    navigate('/');
    setMobileMenuOpen(false);
    // If in Admin mode, this stays on Admin Panel (Index.tsx logic), which is expected behavior for "Home" in that context.
    // If user wants to force specific view, they use the toggle.
  };

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
          <div
            onClick={handleLogoClick}
            className="cursor-pointer"
          >
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
          </div>

          {/* Center - Navigation (Desktop) - ONLY SHOW IN PUBLIC MODE */}
          {mode === 'public' && (
            <div className="hidden lg:flex items-center gap-1">
              <NavLink to="/" end className="px-4 py-2 rounded-lg text-sm font-medium">Map</NavLink>
              <NavLink to="/transport" className="px-4 py-2 rounded-lg text-sm font-medium">Transport</NavLink>
              <NavLink to="/best-times" className="px-4 py-2 rounded-lg text-sm font-medium">Best Times</NavLink>
              <NavLink to="/alerts" className="px-4 py-2 rounded-lg text-sm font-medium">Alerts</NavLink>
            </div>
          )}

          {/* Right - Search & Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <ModeToggle />
            </div>

            {mode === 'public' && (
              <motion.div
                className="relative hidden sm:block"
                initial={false}
                animate={{ width: searchOpen ? 300 : 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {searchOpen ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-9 pr-9 bg-secondary/50"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        // Small delay to allow clicking results
                        setTimeout(() => {
                          if (!searchQuery) setSearchOpen(false);
                        }, 200);
                      }}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                      {searchQuery.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden py-1 z-50"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map(result => (
                              <button
                                key={result.id}
                                className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                                onClick={() => handleResultClick(result.id)}
                              >
                                <div>
                                  <p className="text-sm font-medium text-foreground">{result.name}</p>
                                  <p className="text-xs text-muted-foreground">{result.type} • {result.distance}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                              No locations found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                {mode === 'public' && (
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <NavLink to="/" end className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Map</NavLink>
                    <NavLink to="/transport" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Transport</NavLink>
                    <NavLink to="/best-times" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Best Times</NavLink>
                    <NavLink to="/alerts" className="px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Alerts</NavLink>
                  </div>
                )}
                <ModeToggle />
                {mode === 'public' && (
                  <div className="relative w-full px-4">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-9 bg-secondary/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Mobile Search Results */}
                    {searchQuery.length > 1 && (
                      <div className="bg-popover border border-border rounded-lg mt-2 overflow-hidden">
                        {searchResults.length > 0 ? (
                          searchResults.map(result => (
                            <button
                              key={result.id}
                              className="w-full text-left px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 flex items-center justify-between"
                              onClick={() => handleResultClick(result.id)}
                            >
                              <div>
                                <p className="text-sm font-medium">{result.name}</p>
                                <p className="text-xs text-muted-foreground">{result.type}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">No results</div>
                        )}
                      </div>
                    )}
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
