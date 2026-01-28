import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, Train, Users, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface BusRoute {
    id: string;
    from: string;
    to: string;
    occupation: number;
    status: string;
    nextBus: number;
}

interface TrainRoute {
    id: string;
    route: string;
    occupation: number;
    status: string;
    nextTrain: number;
}

const initialBuses: BusRoute[] = [
    { id: '21G', from: 'Broadway', to: 'Tambaram', occupation: 85, status: 'Crowded', nextBus: 5 },
    { id: '102', from: 'Broadway', to: 'Kelambakkam', occupation: 45, status: 'Moderate', nextBus: 12 },
    { id: '5C', from: 'Broadway', to: 'Taramani', occupation: 30, status: 'Low', nextBus: 8 },
    { id: '29C', from: 'Perambur', to: 'Besant Nagar', occupation: 92, status: 'Very High', nextBus: 3 },
    { id: '27C', from: 'CMBT', to: 'Thiruvanmiyur', occupation: 55, status: 'Moderate', nextBus: 7 },
    { id: '18', from: 'Parry Corner', to: 'Vadapalani', occupation: 78, status: 'Crowded', nextBus: 4 },
    { id: '11C', from: 'T. Nagar', to: 'Adyar', occupation: 25, status: 'Low', nextBus: 10 },
    { id: '47A', from: 'Anna Nagar', to: 'Mylapore', occupation: 68, status: 'Moderate', nextBus: 6 },
    { id: '23C', from: 'Guindy', to: 'Central', occupation: 88, status: 'Crowded', nextBus: 2 },
    { id: '54', from: 'Koyambedu', to: 'OMR', occupation: 42, status: 'Moderate', nextBus: 15 },
    { id: '15B', from: 'Egmore', to: 'Velachery', occupation: 35, status: 'Low', nextBus: 9 },
    { id: '70', from: 'Tambaram', to: 'T. Nagar', occupation: 72, status: 'Crowded', nextBus: 5 },
];

const initialTrains: TrainRoute[] = [
    { id: 'MRTS', route: 'Velachery - Beach', occupation: 60, status: 'Moderate', nextTrain: 7 },
    { id: 'Metro-B', route: 'Wimco Nagar - Airport', occupation: 40, status: 'Low', nextTrain: 4 },
    { id: 'Suburban', route: 'Central - Arakkonam', occupation: 95, status: 'Very High', nextTrain: 10 },
    { id: 'Metro-G', route: 'Central - Poonamallee', occupation: 52, status: 'Moderate', nextTrain: 3 },
    { id: 'EMU', route: 'Beach - Tambaram', occupation: 78, status: 'Crowded', nextTrain: 6 },
    { id: 'Express', route: 'Egmore - Trichy', occupation: 28, status: 'Low', nextTrain: 25 },
];

const TransportPage = () => {
    const [buses, setBuses] = useState<BusRoute[]>(initialBuses);
    const [trains, setTrains] = useState<TrainRoute[]>(initialTrains);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isUpdating, setIsUpdating] = useState(false);

    const getStatus = (occ: number) => {
        if (occ > 80) return 'Very High';
        if (occ > 60) return 'Crowded';
        if (occ > 40) return 'Moderate';
        return 'Low';
    };

    const simulateUpdate = () => {
        setIsUpdating(true);

        // Update buses
        setBuses(prev => prev.map(bus => {
            let next = bus.nextBus - 1;
            let occ = bus.occupation + Math.floor((Math.random() - 0.5) * 15);
            occ = Math.max(15, Math.min(98, occ));
            if (next <= 0) {
                next = Math.floor(Math.random() * 12) + 3;
                occ = Math.floor(Math.random() * 60) + 20;
            }
            return { ...bus, nextBus: next, occupation: occ, status: getStatus(occ) };
        }));

        // Update trains
        setTrains(prev => prev.map(train => {
            let next = train.nextTrain - 1;
            let occ = train.occupation + Math.floor((Math.random() - 0.5) * 12);
            occ = Math.max(10, Math.min(98, occ));
            if (next <= 0) {
                next = Math.floor(Math.random() * 8) + 2;
                occ = Math.floor(Math.random() * 70) + 15;
            }
            return { ...train, nextTrain: next, occupation: occ, status: getStatus(occ) };
        }));

        setLastUpdate(new Date());
        setTimeout(() => setIsUpdating(false), 500);
    };

    useEffect(() => {
        // Initial simulation to mix up the data
        simulateUpdate();

        // Update every 5 seconds for realistic simulation
        const interval = setInterval(simulateUpdate, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="min-h-screen bg-background pt-20 pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="container mx-auto px-4 max-w-4xl">
                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Public Transport Live</h1>
                            <p className="text-muted-foreground">Real-time occupation levels in Chennai</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin text-primary' : ''}`} />
                            <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </header>

                <div className="grid gap-6">
                    {/* Buses Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                <Bus size={22} />
                            </div>
                            <h2 className="text-lg font-semibold">Bus Routes</h2>
                            <span className="text-xs text-muted-foreground ml-auto">{buses.length} active routes</span>
                        </div>
                        <div className="grid gap-3">
                            {buses.map((route) => (
                                <motion.div
                                    key={route.id}
                                    className="glass-card p-3 flex items-center justify-between"
                                    whileHover={{ scale: 1.005 }}
                                    layout
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                                            {route.id}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{route.from} → {route.to}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1"><Users size={12} /> {route.occupation}%</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {route.nextBus}min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${route.occupation > 80 ? 'bg-red-500/10 text-red-500' :
                                            route.occupation > 60 ? 'bg-orange-500/10 text-orange-500' :
                                                route.occupation > 40 ? 'bg-yellow-500/10 text-yellow-600' :
                                                    'bg-green-500/10 text-green-600'
                                        }`}>
                                        {route.status}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Trains Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                                <Train size={22} />
                            </div>
                            <h2 className="text-lg font-semibold">Train Lines</h2>
                            <span className="text-xs text-muted-foreground ml-auto">{trains.length} active lines</span>
                        </div>
                        <div className="grid gap-3">
                            {trains.map((route) => (
                                <motion.div
                                    key={route.id}
                                    className="glass-card p-3 flex items-center justify-between"
                                    whileHover={{ scale: 1.005 }}
                                    layout
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                                            <Train size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{route.id}: {route.route}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1"><Users size={12} /> {route.occupation}%</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {route.nextTrain}min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${route.occupation > 80 ? 'bg-red-500/10 text-red-500' :
                                            route.occupation > 60 ? 'bg-orange-500/10 text-orange-500' :
                                                route.occupation > 40 ? 'bg-yellow-500/10 text-yellow-600' :
                                                    'bg-green-500/10 text-green-600'
                                        }`}>
                                        {route.status}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Alert Banner */}
                    <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-semibold text-yellow-700">Service Update</p>
                            <p className="text-xs text-yellow-600/80 mt-0.5">
                                Expect higher crowds on MRTS lines due to ongoing IPL match at Chepauk. Additional metro services running until midnight.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TransportPage;
