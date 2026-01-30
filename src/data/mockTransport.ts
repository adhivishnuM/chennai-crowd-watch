export interface BusRoute {
    id: string;
    from: string;
    to: string;
    occupation: number;
    status: string;
    nextBus: number;
    trend: 'rising' | 'falling' | 'stable';
}

export interface TrainRoute {
    id: string;
    route: string;
    occupation: number;
    status: string;
    nextTrain: number;
    trend: 'rising' | 'falling' | 'stable';
}

// Seeded pseudo-random number generator (same as mockLocations)
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
    };
}

// Transport-specific time multiplier
function getTransportTimeMultiplier(hour: number, type: 'bus' | 'train', routeId: string): number {
    // Rush hours: 8-10 AM and 5-8 PM
    const isMorningRush = hour >= 8 && hour <= 10;
    const isEveningRush = hour >= 17 && hour <= 20;

    // Base traffic pattern
    let baseLoad = 0.3; // Minimum 30% load usually

    if (isMorningRush || isEveningRush) {
        baseLoad = 0.85; // High load during rush hours
    } else if (hour >= 23 || hour < 5) {
        baseLoad = 0.1; // Late night / Early morning
    } else {
        baseLoad = 0.5; // Mid-day moderate
    }

    // Add randomness based on route ID so not all routes are identical
    const seed = routeId.charCodeAt(0) + hour;
    const rng = seededRandom(seed);
    const variation = (rng() - 0.5) * 0.2; // +/- 10% variation

    return Math.max(0, Math.min(1, baseLoad + variation));
}

const baseBuses: Omit<BusRoute, 'occupation' | 'status' | 'nextBus' | 'trend'>[] = [
    { id: '21G', from: 'Broadway', to: 'Tambaram' },
    { id: '102', from: 'Broadway', to: 'Kelambakkam' },
    { id: '5C', from: 'Broadway', to: 'Taramani' },
    { id: '29C', from: 'Perambur', to: 'Besant Nagar' },
    { id: '27C', from: 'CMBT', to: 'Thiruvanmiyur' },
    { id: '18', from: 'Parry Corner', to: 'Vadapalani' },
    { id: '11C', from: 'T. Nagar', to: 'Adyar' },
    { id: '47A', from: 'Anna Nagar', to: 'Mylapore' },
    { id: '23C', from: 'Guindy', to: 'Central' },
    { id: '54', from: 'Koyambedu', to: 'OMR' },
    { id: '15B', from: 'Egmore', to: 'Velachery' },
    { id: '70', from: 'Tambaram', to: 'T. Nagar' },
];

const baseTrains: Omit<TrainRoute, 'occupation' | 'status' | 'nextTrain' | 'trend'>[] = [
    { id: 'MRTS', route: 'Velachery - Beach' },
    { id: 'Metro-B', route: 'Wimco Nagar - Airport' },
    { id: 'Suburban', route: 'Central - Arakkonam' },
    { id: 'Metro-G', route: 'Central - Poonamallee' },
    { id: 'EMU', route: 'Beach - Tambaram' },
    { id: 'Express', route: 'Egmore - Trichy' },
];

export function getStatus(occupation: number): string {
    if (occupation > 80) return 'Very High';
    if (occupation > 60) return 'Crowded';
    if (occupation > 40) return 'Moderate';
    return 'Low';
}

function getNextArrival(routeId: string, type: 'bus' | 'train'): number {
    const now = new Date();
    // Deterministic but changing per minute
    const seed = routeId.charCodeAt(0) + now.getMinutes() + (type === 'bus' ? 0 : 100);
    const rng = seededRandom(seed);

    // Buses: 2-20 mins, Trains: 3-15 mins
    const min = type === 'bus' ? 2 : 3;
    const max = type === 'bus' ? 20 : 15;

    return Math.floor(rng() * (max - min)) + min;
}

export function getTransportData() {
    const now = new Date();
    const hour = now.getHours();

    // Global minute-level fluctuation
    const minuteFluctuation = Math.sin(now.getMinutes() / 10) * 0.05;

    const buses: BusRoute[] = baseBuses.map(bus => {
        const timeMultiplier = getTransportTimeMultiplier(hour, 'bus', bus.id);
        const randomNoise = (Math.random() - 0.5) * 0.1; // Real-time noise

        // Calculate raw occupation 0-1
        let rawOccupation = timeMultiplier + minuteFluctuation + randomNoise;

        // Special case: '21G' and '29C' are always crowded
        if (bus.id === '21G' || bus.id === '29C') {
            rawOccupation += 0.2;
        }

        rawOccupation = Math.max(0.1, Math.min(0.99, rawOccupation));
        const occupation = Math.round(rawOccupation * 100);

        // Determine trend
        const prevOccupation = occupation - (randomNoise * 100); // Rough estimate of "previous"
        const trend = occupation > prevOccupation ? 'rising' : occupation < prevOccupation ? 'falling' : 'stable';

        return {
            ...bus,
            occupation,
            status: getStatus(occupation),
            nextBus: getNextArrival(bus.id, 'bus'),
            trend
        };
    });

    const trains: TrainRoute[] = baseTrains.map(train => {
        const timeMultiplier = getTransportTimeMultiplier(hour, 'train', train.id);
        const randomNoise = (Math.random() - 0.5) * 0.08;

        let rawOccupation = timeMultiplier + minuteFluctuation + randomNoise;

        // Suburban trains are usually crowded
        if (train.id === 'Suburban' || train.id === 'EMU') {
            rawOccupation += 0.15;
        }

        rawOccupation = Math.max(0.1, Math.min(0.99, rawOccupation));
        const occupation = Math.round(rawOccupation * 100);

        // Determine trend
        const prevOccupation = occupation - (randomNoise * 100);
        const trend = occupation > prevOccupation ? 'rising' : occupation < prevOccupation ? 'falling' : 'stable';

        return {
            ...train,
            occupation,
            status: getStatus(occupation),
            nextTrain: getNextArrival(train.id, 'train'),
            trend
        };
    });

    return { buses, trains };
}
