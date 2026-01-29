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
  { id: 'live-cctv', label: 'Live CCTV', icon: Globe },
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
          "fixed left-0 top-0 bottom-0 z-40 bg-zinc-950 text-zinc-400 flex flex-col transition-all duration-300 border-r border-white/5",
          sidebarCollapsed ? "w-20" : "w-72"
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 288 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Sidebar Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-zinc-950 shadow-2xl rotate-3">
              <Globe className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-tighter italic">Crowdex</span>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">Command Center</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                activePage === item.id
                  ? "bg-white text-zinc-950 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                  : "hover:bg-white/5 hover:text-white"
              )}
              onClick={() => setActivePage(item.id)}
              whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-all duration-500",
                activePage === item.id ? "text-zinc-950 scale-110" : "text-zinc-500 group-hover:text-white"
              )} />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {activePage === item.id && (
                <motion.div
                  layoutId="active-glow"
                  className="absolute inset-0 bg-white/5 opacity-50"
                  initial={false}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* User Profile Hook / Status */}
        <div className="p-6 border-t border-white/5">
          {!sidebarCollapsed && (
            <div className="mb-6 bg-white/5 rounded-[1.5rem] p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Admin Node</p>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mt-1">Sysop v1.4.2</p>
                </div>
              </div>
            </div>
          )}

          <button
            className="w-full h-12 flex items-center justify-center rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all border border-white/5"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-white" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{sidebarCollapsed ? '' : 'Collapse UI'}</span>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-72"
        )}
      >
        <motion.div
          key={activePage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="p-10 pt-24"
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
}
