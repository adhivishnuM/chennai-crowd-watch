import { ModeProvider, useMode } from '@/context/ModeContext';
import { Navbar } from '@/components/Navbar';
import PublicHome from './PublicHome';
import BestTimes from './BestTimes';
import LocationDetail from './LocationDetail';
import AdminPanel from './AdminPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Map, Clock, Bell, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

function MobileTabBar() {
  const { mode } = useMode();
  
  if (mode === 'admin') return null;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-card rounded-none border-t border-border/50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-around h-16">
        <NavLink 
          to="/" 
          end
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Map className="w-5 h-5" />
          <span className="text-xs">Map</span>
        </NavLink>
        <NavLink 
          to="/best-times"
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Clock className="w-5 h-5" />
          <span className="text-xs">Best Times</span>
        </NavLink>
        <NavLink 
          to="/alerts"
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Bell className="w-5 h-5" />
          <span className="text-xs">Alerts</span>
        </NavLink>
      </div>
    </motion.nav>
  );
}

function AppContent() {
  const { mode } = useMode();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatePresence mode="wait">
        {mode === 'public' ? (
          <motion.div
            key="public"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-16 lg:pb-0"
          >
            <Routes location={location}>
              <Route path="/" element={<PublicHome />} />
              <Route path="/best-times" element={<BestTimes />} />
              <Route path="/location/:id" element={<LocationDetail />} />
              <Route path="/alerts" element={<BestTimes />} />
            </Routes>
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminPanel />
          </motion.div>
        )}
      </AnimatePresence>
      <MobileTabBar />
    </div>
  );
}

export default function Index() {
  return (
    <ModeProvider>
      <AppContent />
    </ModeProvider>
  );
}
