import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Swords, Package, HeartPulse,
  Youtube, Upload, Play, Square, AlertTriangle,
  CheckCircle2, Clock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

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
    theme: {
      primary: 'text-red-500',
      secondary: 'bg-red-500/10',
      border: 'border-red-500/20',
      bg: 'bg-red-500',
      muted: 'text-red-500/70',
      badge: 'red'
    }
  },
  abandoned_object: {
    icon: Package,
    label: 'Abandoned Object',
    description: 'Unattended baggage detection with object tracking',
    theme: {
      primary: 'text-blue-500',
      secondary: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500',
      muted: 'text-blue-500/70',
      badge: 'blue'
    }
  },
  accident: {
    icon: HeartPulse,
    label: 'Medical Emergency',
    description: 'Prone human detection for 108 Emergency Services',
    theme: {
      primary: 'text-emerald-500',
      secondary: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500',
      muted: 'text-emerald-500/70',
      badge: 'emerald'
    }
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

  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            threat_types: [activeTab],
            frame_skip: 15,
            testing_mode: testingMode
          }),
        });
      } else {
        const formData = new FormData();
        formData.append('file', file!);

        response = await fetch(`${API_BASE_URL}/threat/analyze?threat_types=${activeTab}&testing_mode=${testingMode}`, {
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
      setAnalysisState(prev => ({ ...prev, status: 'error' }));
      alert(`Analysis failed: ${error.message}`);
    }
  };

  const connectWebSocket = (id: string) => {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Threat Analysis</h1>
            <p className="text-muted-foreground text-sm">AI-powered security threat detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
          <EyeOff className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Admin Only</span>
        </div>
      </div>

      {/* Threat Type Selection */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(threatTypeConfig) as ThreatType[]).map((type) => {
          const cfg = threatTypeConfig[type];
          const Icon = cfg.icon;
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                resetAnalysis();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? `${cfg.theme.bg} text-white`
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className={cn("overflow-hidden border-l-4", config.theme.border)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.theme.secondary)}>
                  <config.icon className={cn("w-5 h-5", config.theme.primary)} />
                </div>
                <div>
                  <h3 className="font-medium">{config.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Input */}
          {analysisState.status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Mode Toggle only */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", activeTab === 'fight' ? 'bg-red-500' : activeTab === 'accident' ? 'bg-emerald-500' : 'bg-blue-500')} />
                      <span className="text-sm font-medium">Analyzing: {config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="test-mode"
                        checked={testingMode}
                        onCheckedChange={setTestingMode}
                      />
                      <Label htmlFor="test-mode" className="text-sm text-muted-foreground">
                        Test Mode
                      </Label>
                    </div>
                  </div>

                  {/* YouTube URL Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium block">YouTube Video URL</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        onClick={() => startAnalysis('youtube')}
                        disabled={!youtubeUrl}
                        className={cn("transition-colors", config.theme.bg)}
                      >
                        <Play className="w-4 h-4 mr-2 text-white" />
                        <span className="text-white">Analyze</span>
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">OR</span>
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
                      className={cn("w-full h-12 border-dashed border-2 hover:bg-secondary transition-all")}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className={cn("w-4 h-4 mr-2", config.theme.primary)} />
                      Upload Video for {config.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Processing View */}
          {(analysisState.status === 'downloading' || analysisState.status === 'processing') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="overflow-hidden border-t-4" style={{ borderColor: 'var(--primary)' }}>
                <CardContent className="p-6 space-y-6">
                  {/* Preview */}
                  <div className="aspect-video bg-secondary rounded-xl overflow-hidden relative border shadow-inner">
                    {analysisState.preview_frame ? (
                      <img
                        src={`data:image/jpeg;base64,${analysisState.preview_frame}`}
                        alt="Analysis Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ShieldAlert className={cn("w-12 h-12 animate-pulse mx-auto", config.theme.primary)} />
                          <p className="text-sm text-muted-foreground mt-3 font-medium">
                            {analysisState.status === 'downloading' ? 'Downloading video...' : 'AI Engine Initializing...'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className={cn("px-3 py-1 text-white border-0 shadow-lg", config.theme.bg)}>
                        LIVE Analysis
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {analysisState.status === 'downloading' ? 'Retreiving Stream...' : `Detecting ${config.label.split(' ')[0]}s...`}
                      </span>
                      <span className="font-bold tabular-nums text-primary">{analysisState.progress}%</span>
                    </div>
                    <Progress value={analysisState.progress} className="h-2.5" />
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={cn("rounded-xl p-4 text-center border transition-all", config.theme.secondary, config.theme.border)}>
                      <AlertTriangle className={cn("w-5 h-5 mx-auto mb-2", config.theme.primary)} />
                      <p className="text-xl font-bold tabular-nums">{analysisState.current_alerts}</p>
                      <p className="text-xs font-semibold opacity-70">Alerts</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-4 text-center border">
                      <Eye className="w-5 h-5 text-foreground mx-auto mb-2" />
                      <p className="text-xl font-bold tabular-nums">{analysisState.recent_events.length}</p>
                      <p className="text-xs text-muted-foreground font-semibold">Events</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-4 text-center border">
                      <Clock className="w-5 h-5 text-foreground mx-auto mb-2" />
                      <p className="text-xl font-bold tabular-nums">{analysisState.progress}%</p>
                      <p className="text-xs text-muted-foreground font-semibold">Progress</p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={resetAnalysis} className="w-full hover:bg-destructive hover:text-destructive-foreground transition-all">
                    <Square className="w-4 h-4 mr-2" />
                    Terminate Analysis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Complete View */}
          {analysisState.status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="bg-secondary/30 border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner", config.theme.secondary)}>
                    <CheckCircle2 className={cn("w-8 h-8", config.theme.primary)} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Analysis Complete</h3>
                  <p className="text-muted-foreground mb-6 font-medium">
                    Session Duration: {analysisState.processing_time?.toFixed(1)}s
                  </p>
                  <div className={cn("inline-flex flex-col items-center rounded-2xl px-10 py-6 mb-8 shadow-sm border", config.theme.secondary, config.theme.border)}>
                    <p className={cn("text-4xl font-extrabold tabular-nums", config.theme.primary)}>{analysisState.total_alerts || 0}</p>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest mt-1">Validated Threats</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => window.location.reload()} size="lg">
                      View Report
                    </Button>
                    <Button onClick={resetAnalysis} size="lg" className={config.theme.bg}>
                      <span className="text-white">New Analysis</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Error View */}
          {analysisState.status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground mb-6">
                    There was an error processing the video.
                  </p>
                  <Button onClick={resetAnalysis} variant="outline" size="lg">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Alerts Sidebar */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-t-4" style={{ borderColor: 'var(--primary)' }}>
            <CardHeader className="pb-3 bg-secondary/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Session Analytics</CardTitle>
                <Badge variant="secondary" className={cn("rounded-full px-3 py-1 font-bold", config.theme.bg, "text-white")}>
                  {alerts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="text-center py-16 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No threats in stream</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("p-4 rounded-2xl border transition-all hover:shadow-md", config.theme.secondary, config.theme.border)}
                    >
                      <div className="flex items-start gap-4">
                        {alert.screenshot_b64 && (
                          <div className="relative group flex-shrink-0">
                            <img
                              src={`data:image/jpeg;base64,${alert.screenshot_b64}`}
                              alt="Alert"
                              className="w-20 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge
                              className={cn("px-2 py-0.5 text-[10px] font-black rounded-full uppercase text-white border-0", config.theme.bg)}
                            >
                              {(alert.confidence * 100).toFixed(0)}% Match
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                            {activeTab === 'abandoned_object' ? (
                              <>
                                <Package className={cn("w-3.5 h-3.5", config.theme.primary)} />
                                <span className={config.theme.primary}>{alert.location || 'Current Position'}</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className={cn("w-3.5 h-3.5", config.theme.primary)} />
                                <span>{alert.location || 'Camera 01'}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Detected via Temporal Analysis
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}