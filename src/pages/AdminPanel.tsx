import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MapPin,
  Video,
  Upload,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminDashboard from './admin/AdminDashboard';
import AdminLocations from './admin/AdminLocations';
import AdminCameras from './admin/AdminCameras';
import AdminLiveCCTV from './admin/AdminLiveCCTV';
import AdminVideoUpload from './admin/AdminVideoUpload';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminSettings from './admin/AdminSettings';

type AdminPage = 'dashboard' | 'locations' | 'cameras' | 'live-cctv' | 'upload' | 'analytics' | 'settings';

const navItems: { id: AdminPage; label: string; icon: typeof LayoutDashboard; highlight?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'cameras', label: 'Local Camera', icon: Video },
  { id: 'live-cctv', label: 'Live CCTV', icon: Globe, highlight: true },
  { id: 'upload', label: 'Video Upload', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPanel() {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'locations':
        return <AdminLocations />;
      case 'cameras':
        return <AdminCameras />;
      case 'live-cctv':
        return <AdminLiveCCTV />;
      case 'upload':
        return <AdminVideoUpload />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 flex">
      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 glass-card rounded-none border-r border-border/50 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                activePage === item.id
                  ? "bg-primary text-primary-foreground"
                  : item.highlight
                    ? "text-primary hover:text-primary hover:bg-primary/10 border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              onClick={() => setActivePage(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.highlight && !sidebarCollapsed && activePage !== item.id && (
                <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          className="p-3 border-t border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
}
