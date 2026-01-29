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
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200"
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="relative w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tighter text-zinc-950 uppercase italic">Crowdex</span>
                  <div className="hidden xs:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-500 font-mono tracking-tighter shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                    {timeString}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none hidden sm:block">
                  Know Before You Go
                </span>
              </div>
            </div>
          </div>

          {/* Center - Navigation (Desktop) - ONLY SHOW IN PUBLIC MODE */}
          {mode === 'public' && (
            <div className="hidden lg:flex items-center bg-zinc-100/50 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
              <NavLink to="/" end className="px-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white hover:shadow-sm">Map</NavLink>
              <NavLink to="/transport" className="px-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white hover:shadow-sm">Transport</NavLink>
              <NavLink to="/best-times" className="px-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white hover:shadow-sm">Optimization</NavLink>
            </div>
          )}

          {/* Right - Search & Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <ModeToggle />
            </div>

            {mode === 'public' && (
              <motion.div
                className="relative hidden sm:block"
                initial={false}
                animate={{ width: searchOpen ? 300 : 44 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {searchOpen ? (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder="Search Monitoring Network..."
                      className="h-11 pl-11 pr-11 bg-zinc-100 border-none rounded-2xl text-sm font-medium focus-visible:ring-primary/20 shadow-inner"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (!searchQuery) setSearchOpen(false);
                        }, 200);
                      }}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-200 transition-colors"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <X className="w-3.5 h-3.5 text-zinc-500" />
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
