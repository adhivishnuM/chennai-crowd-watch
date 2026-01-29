import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MapPin, Video, X } from 'lucide-react';
import { chennaiLocations, Location } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationTypeIcon, locationTypeFilters } from '@/components/LocationTypeIcon';
import { cn } from '@/lib/utils';

export default function AdminLocations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const filteredLocations = chennaiLocations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Registry Management
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-950">Spatial Assets</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Manage geographical intelligence nodes and capacity thresholds</p>
        </div>
        <Button onClick={openAddModal} className="h-12 px-8 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Register New Asset
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <motion.div
          className="relative flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search spatial registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 bg-zinc-100 border-none rounded-2xl text-[11px] font-bold uppercase tracking-widest focus-visible:ring-zinc-950/20 shadow-inner"
          />
        </motion.div>
        <div className="hidden md:flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
          <Button variant="ghost" className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white shadow-sm italic">All Nodes</Button>
          <Button variant="ghost" className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400">High Density</Button>
          <Button variant="ghost" className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400">Low Density</Button>
        </div>
      </div>

      {/* Table Card */}
      <motion.div
        className="glass-card border-zinc-200 shadow-2xl overflow-hidden bg-white rounded-[2.5rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Asset Profile</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hidden lg:table-cell">Geolocation Signature</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Status Vector</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Uplinks</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Threshold</th>
                <th className="text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredLocations.map((location, index) => (
                <motion.tr
                  key={location.id}
                  className="group hover:bg-zinc-50/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                        <LocationTypeIcon type={location.type} size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 uppercase tracking-tighter block">{location.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">{location.address}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden lg:table-cell">
                    <code className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter bg-zinc-100 px-2 py-1 rounded-md">
                      {location.lat.toFixed(4)}N / {location.lng.toFixed(4)}E
                    </code>
                  </td>
                  <td className="p-6">
                    <CrowdBadge level={location.crowdLevel} size="sm" showPulse={true} />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-lg bg-zinc-100 border-2 border-white flex items-center justify-center">
                            <Video className="w-3.5 h-3.5 text-zinc-500" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-zinc-400">+{Math.floor(Math.random() * 5)}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                        <span className="text-zinc-400">Cap Lmt</span>
                        <span className="text-zinc-950">{location.capacity.toLocaleString()}</span>
                      </div>
                      <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(location.currentCount / location.capacity) * 100}%` }}
                          className={cn(
                            "h-full",
                            location.crowdLevel === 'high' ? "bg-red-500" : location.crowdLevel === 'medium' ? "bg-orange-500" : "bg-green-500"
                          )}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-all">
                        <Eye className="w-4.5 h-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-all"
                        onClick={() => openEditModal(location)}
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl">
          <div className="bg-zinc-950 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                {editingLocation ? 'Re-configure Asset' : 'Register New Node'}
              </DialogTitle>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">Spatial Intelligence Registry Interface</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node Designation</Label>
              <Input
                id="name"
                placeholder="ALPHA-DESIGNATION"
                className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-bold uppercase tracking-tight focus-visible:ring-zinc-950/10 shadow-inner"
                defaultValue={editingLocation?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Geospatial Address</Label>
              <Input
                id="address"
                placeholder="CHENNAI-GRID-LOCATION"
                className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-bold uppercase tracking-tight focus-visible:ring-zinc-950/10 shadow-inner"
                defaultValue={editingLocation?.address}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">LAT Vector</Label>
                <Input
                  id="lat"
                  placeholder="13.0000"
                  className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-bold font-mono focus-visible:ring-zinc-950/10 shadow-inner"
                  defaultValue={editingLocation?.lat}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">LNG Vector</Label>
                <Input
                  id="lng"
                  placeholder="80.0000"
                  className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-bold font-mono focus-visible:ring-zinc-950/10 shadow-inner"
                  defaultValue={editingLocation?.lng}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asset Class</Label>
                <Select defaultValue={editingLocation?.type || 'mall'}>
                  <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-[10px] font-black uppercase shadow-inner">
                    <SelectValue placeholder="CLASS" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-200 shadow-2xl">
                    {locationTypeFilters.filter(f => f.value !== 'all').map(f => (
                      <SelectItem key={f.value} value={f.value} className="text-[10px] font-black uppercase">
                        <div className="flex items-center gap-3">
                          <LocationTypeIcon type={f.value} size={14} />
                          <span>{f.label.replace(/s$/, '')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node Cap Threshold</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="10000"
                  className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-black italic pr-10 shadow-inner"
                  defaultValue={editingLocation?.capacity}
                />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-100" onClick={() => setIsModalOpen(false)}>
                Abort
              </Button>
              <Button className="flex-1 h-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all" onClick={() => setIsModalOpen(false)}>
                {editingLocation ? 'Synchronize Data' : 'Execute Registration'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
