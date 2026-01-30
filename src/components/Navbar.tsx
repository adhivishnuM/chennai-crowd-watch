import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Menu, X, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = chennaiLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
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

  const handleLogoClick = () => {
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div onClick={handleLogoClick} className="cursor-pointer flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Crowdex</span>
          </div>

          {/* Center Navigation */}
          {mode === 'public' && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink 
                to="/" 
                end 
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Map
              </NavLink>
              <NavLink 
                to="/transport" 
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Transport
              </NavLink>
              <NavLink 
                to="/best-times" 
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Best Times
              </NavLink>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <ModeToggle />
            </div>

            {mode === 'public' && (
              <div className="relative hidden sm:block">
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.div
                      key="search-input"
                      initial={{ width: 44, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 44, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search locations..."
                        className="h-10 pl-9 pr-9 bg-secondary border-0 rounded-full text-sm"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {searchQuery.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map(result => (
                              <button
                                key={result.id}
                                className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-center justify-between"
                                onClick={() => handleResultClick(result.id)}
                              >
                                <div>
                                  <p className="text-sm font-medium">{result.name}</p>
                                  <p className="text-xs text-muted-foreground">{result.address}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                              No results found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button
                      key="search-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Search className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              className="md:hidden w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
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
              className="md:hidden py-4 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-4">
                {mode === 'public' && (
                  <div className="flex flex-col gap-1">
                    <NavLink to="/" end className="px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Map</NavLink>
                    <NavLink to="/transport" className="px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Transport</NavLink>
                    <NavLink to="/best-times" className="px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Best Times</NavLink>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <ModeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
