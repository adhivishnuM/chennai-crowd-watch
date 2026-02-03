import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Swords, Package, HeartPulse,
    Youtube, Upload, Play, Square, AlertTriangle,
    CheckCircle2, Clock, Eye, EyeOff, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api';

type ThreatType = 'fight' | 'abandoned_object' | 'accident';
type AnalysisStatus = 'idle' | 'downloading' | 'processing' | 'complete' | 'error';

interface ThreatAlert {
    id: string;
    threat_type: string;
    confidence: number;
    location: string;
    timestamp: number;
    status: string;
    screenshot_b64?: string;
    created_at: string;
}

interface AnalysisState {
    status: AnalysisStatus;
    progress: number;
    preview_frame?: string;
    current_alerts: number;
    recent_events: any[];
    total_alerts?: number;
    processing_time?: number;
}

const threatTypeConfig = {
    fight: {
        icon: Swords,
        label: 'Fight Detection',
        description: 'Violence & aggression detection using temporal action recognition',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    abandoned_object: {
        icon: Package,
        label: 'Abandoned Object',
        description: 'Unattended baggage/IED detection with object tracking',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    accident: {
        icon: HeartPulse,
        label: 'Medical Emergency',
        description: 'Prone human detection for 108 Emergency Services',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
};

export default function AdminThreatAnalysis() {
    const [activeTab, setActiveTab] = useState<ThreatType>('fight');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [testingMode, setTestingMode] = useState(false);
    const [analysisState, setAnalysisState] = useState<AnalysisState>({
        status: 'idle',
        progress: 0,
        current_alerts: 0,
        recent_events: [],
    });
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
    const [selectedThreats, setSelectedThreats] = useState<ThreatType[]>(['fight', 'abandoned_object', 'accident']);

    const wsRef = useRef<WebSocket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch alerts on mount
    useEffect(() => {
        fetchAlerts();
    }, [activeTab]);

    const fetchAlerts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/threat/alerts?limit=20&threat_type=${activeTab}`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const toggleThreatType = (type: ThreatType) => {
        setSelectedThreats(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const startAnalysis = async (source: 'youtube' | 'upload', file?: File) => {
        if (source === 'youtube' && !youtubeUrl) return;
        if (source === 'upload' && !file) return;

        const initialStatus: AnalysisStatus = source === 'youtube' ? 'downloading' : 'processing';
        setAnalysisState({ status: initialStatus, progress: 0, current_alerts: 0, recent_events: [] });

        try {
            let response;

            if (source === 'youtube') {
                response = await fetch(`${API_BASE_URL}/threat/analyze/youtube`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        youtube_url: youtubeUrl,
                        threat_types: selectedThreats,
                        frame_skip: 15,
                        testing_mode: testingMode
                    }),
                });
            } else {
                const formData = new FormData();
                formData.append('file', file!);

                response = await fetch(`${API_BASE_URL}/threat/analyze?threat_types=${selectedThreats.join(',')}&testing_mode=${testingMode}`, {
                    method: 'POST',
                    body: formData,
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.error || 'Analysis failed');
            }

            const data = await response.json();
            setAnalysisId(data.id);
            connectWebSocket(data.id);
        } catch (error: any) {
            console.error('Analysis error:', error);
            // Show error in UI state if possible, currently setting status to error
            setAnalysisState(prev => ({
                ...prev,
                status: 'error',
                // You might want to add an error message field to state to display it
            }));
            alert(`Analysis failed: ${error.message}`); // Simple alert for now
        }
    };

    const connectWebSocket = (id: string) => {
        // Backend router is at /api/threat, and endpoint is /ws/stream/{id}
        // So full path is /api/threat/ws/stream/{id}
        const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/threat/ws/stream/${id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const lastAlertCount = { current: 0 };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                setAnalysisState(prev => ({ ...prev, status: 'error' }));
                ws.close();
                return;
            }

            setAnalysisState({
                status: data.status === 'completed' ? 'complete' : 'processing',
                progress: data.progress || 0,
                preview_frame: data.preview_frame,
                current_alerts: data.current_alerts || 0,
                recent_events: data.recent_events || [],
                total_alerts: data.total_alerts,
                processing_time: data.processing_time,
            });

            // Update alerts list if new alerts detected
            if (data.current_alerts > lastAlertCount.current) {
                lastAlertCount.current = data.current_alerts;
                fetchAlerts();
            }

            if (data.status === 'completed' || data.status === 'error') {
                ws.close();
            }
        };

        ws.onerror = () => {
            setAnalysisState(prev => ({ ...prev, status: 'error' }));
        };
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) startAnalysis('upload', file);
    };

    const resetAnalysis = () => {
        setAnalysisState({ status: 'idle', progress: 0, current_alerts: 0, recent_events: [] });
        setAnalysisId(null);
        setYoutubeUrl('');
        if (wsRef.current) wsRef.current.close();
    };

    const config = threatTypeConfig[activeTab];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Threat Analysis</h1>
                            <p className="text-muted-foreground text-sm">AI-powered security threat detection</p>
                        </div>
                    </div>
                </div>

                {/* Privacy Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Admin Only • Privacy-First</span>
                </div>
            </div>

            {/* Threat Type Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ThreatType)}>
                <TabsList className="grid grid-cols-3 w-full max-w-lg">
                    {(Object.keys(threatTypeConfig) as ThreatType[]).map((type) => {
                        const cfg = threatTypeConfig[type];
                        return (
                            <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                                <span className="hidden sm:inline">{cfg.label.split(' ')[0]}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {(Object.keys(threatTypeConfig) as ThreatType[]).map((type) => (
                    <TabsContent key={type} value={type} className="mt-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Analysis Panel */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Info Card */}
                                <div className={`glass-card p-4 ${threatTypeConfig[type].bgColor}`}>
                                    <div className="flex items-start gap-3">
                                        {(() => {
                                            const Icon = threatTypeConfig[type].icon;
                                            return <Icon className={`w-6 h-6 ${threatTypeConfig[type].color}`} />;
                                        })()}
                                        <div>
                                            <h3 className="font-medium">{threatTypeConfig[type].label}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {threatTypeConfig[type].description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Input */}
                                {analysisState.status === 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card p-6 space-y-4"
                                    >
                                        {/* Threat Type Selection */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium">Detection Types</label>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="test-mode"
                                                        checked={testingMode}
                                                        onCheckedChange={setTestingMode}
                                                    />
                                                    <Label htmlFor="test-mode" className="text-sm text-muted-foreground">
                                                        Test Mode (Fast triggers)
                                                    </Label>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(Object.keys(threatTypeConfig) as ThreatType[]).map((t) => (
                                                    <Button
                                                        key={t}
                                                        variant={selectedThreats.includes(t) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => toggleThreatType(t)}
                                                    >
                                                        {threatTypeConfig[t].label.split(' ')[0]}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* YouTube URL Input */}
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">YouTube Video URL</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                    <Input
                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                        value={youtubeUrl}
                                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <Button onClick={() => startAnalysis('youtube')} disabled={!youtubeUrl}>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Analyze
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="text-xs text-muted-foreground">OR</span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>

                                        {/* File Upload */}
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="video/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Video File
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Processing View */}
                                {(analysisState.status === 'downloading' || analysisState.status === 'processing') && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="glass-card p-6 space-y-4"
                                    >
                                        {/* Preview */}
                                        <div className="aspect-video bg-secondary rounded-xl overflow-hidden">
                                            {analysisState.preview_frame ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${analysisState.preview_frame}`}
                                                    alt="Analysis Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <ShieldAlert className="w-16 h-16 text-muted-foreground animate-pulse mx-auto" />
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            {analysisState.status === 'downloading' ? 'Downloading video...' : 'Initializing analysis...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {analysisState.status === 'downloading' ? 'Downloading...' : 'Analyzing...'}
                                                </span>
                                                <span>{analysisState.progress}%</span>
                                            </div>
                                            <Progress value={analysisState.progress} />
                                        </div>

                                        {/* Live Stats */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-secondary rounded-lg p-3 text-center">
                                                <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                                <p className="text-lg font-semibold">{analysisState.current_alerts}</p>
                                                <p className="text-xs text-muted-foreground">Alerts</p>
                                            </div>
                                            <div className="bg-secondary rounded-lg p-3 text-center">
                                                <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                                <p className="text-lg font-semibold">{analysisState.recent_events.length}</p>
                                                <p className="text-xs text-muted-foreground">Events</p>
                                            </div>
                                            <div className="bg-secondary rounded-lg p-3 text-center">
                                                <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                                <p className="text-lg font-semibold">{analysisState.progress}%</p>
                                                <p className="text-xs text-muted-foreground">Progress</p>
                                            </div>
                                        </div>

                                        <Button variant="outline" onClick={resetAnalysis} className="w-full">
                                            <Square className="w-4 h-4 mr-2" />
                                            Cancel Analysis
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Complete View */}
                                {analysisState.status === 'complete' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="glass-card p-6 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Analysis Complete</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Processed in {analysisState.processing_time?.toFixed(1)}s
                                        </p>
                                        <div className="flex justify-center gap-4 mb-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-500">{analysisState.total_alerts || 0}</p>
                                                <p className="text-xs text-muted-foreground">Threats Detected</p>
                                            </div>
                                        </div>
                                        <Button onClick={resetAnalysis}>
                                            New Analysis
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Error View */}
                                {analysisState.status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="glass-card p-6 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
                                        <p className="text-muted-foreground mb-4">
                                            There was an error processing the video.
                                        </p>
                                        <Button onClick={resetAnalysis} variant="outline">
                                            Try Again
                                        </Button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Alerts Sidebar */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Recent Alerts</h3>
                                    <Badge variant="secondary">{alerts.length}</Badge>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {alerts.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No alerts for this type</p>
                                        </div>
                                    ) : (
                                        alerts.map((alert) => (
                                            <motion.div
                                                key={alert.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="glass-card p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {alert.screenshot_b64 && (
                                                        <img
                                                            src={`data:image/jpeg;base64,${alert.screenshot_b64}`}
                                                            alt="Alert"
                                                            className="w-16 h-12 rounded object-cover"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={alert.status === 'pending' ? 'destructive' : 'secondary'}
                                                                className="text-xs"
                                                            >
                                                                {(alert.confidence * 100).toFixed(0)}%
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {alert.location}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(alert.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
