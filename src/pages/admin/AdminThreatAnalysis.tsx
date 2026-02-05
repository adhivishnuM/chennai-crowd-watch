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
  },
  abandoned_object: {
    icon: Package,
    label: 'Abandoned Object',
    description: 'Unattended baggage/IED detection with object tracking',
  },
  accident: {
    icon: HeartPulse,
    label: 'Medical Emergency',
    description: 'Prone human detection for 108 Emergency Services',
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
              onClick={() => setActiveTab(type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
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
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {(() => {
                  const Icon = config.icon;
                  return (
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                  );
                })()}
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
                  {/* Detection Types */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Detection Types</label>
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
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(threatTypeConfig) as ThreatType[]).map((t) => {
                        const ThreatIcon = threatTypeConfig[t].icon;
                        return (
                          <button
                            key={t}
                            onClick={() => toggleThreatType(t)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                              selectedThreats.includes(t)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <ThreatIcon className="w-4 h-4" />
                            {threatTypeConfig[t].label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* YouTube URL Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">YouTube Video URL</label>
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
                      <Button onClick={() => startAnalysis('youtube')} disabled={!youtubeUrl}>
                        <Play className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
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
                      className="w-full h-12"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video File
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
              <Card>
                <CardContent className="p-6 space-y-6">
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
                          <ShieldAlert className="w-12 h-12 text-muted-foreground animate-pulse mx-auto" />
                          <p className="text-sm text-muted-foreground mt-3">
                            {analysisState.status === 'downloading' ? 'Downloading video...' : 'Initializing analysis...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {analysisState.status === 'downloading' ? 'Downloading...' : 'Analyzing...'}
                      </span>
                      <span className="font-medium tabular-nums">{analysisState.progress}%</span>
                    </div>
                    <Progress value={analysisState.progress} className="h-2" />
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary rounded-xl p-4 text-center">
                      <AlertTriangle className="w-5 h-5 text-foreground mx-auto mb-2" />
                      <p className="text-xl font-semibold tabular-nums">{analysisState.current_alerts}</p>
                      <p className="text-xs text-muted-foreground">Alerts</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-4 text-center">
                      <Eye className="w-5 h-5 text-foreground mx-auto mb-2" />
                      <p className="text-xl font-semibold tabular-nums">{analysisState.recent_events.length}</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-4 text-center">
                      <Clock className="w-5 h-5 text-foreground mx-auto mb-2" />
                      <p className="text-xl font-semibold tabular-nums">{analysisState.progress}%</p>
                      <p className="text-xs text-muted-foreground">Progress</p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={resetAnalysis} className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    Cancel Analysis
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
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Analysis Complete</h3>
                  <p className="text-muted-foreground mb-6">
                    Processed in {analysisState.processing_time?.toFixed(1)}s
                  </p>
                  <div className="inline-flex flex-col items-center bg-secondary rounded-2xl px-8 py-4 mb-6">
                    <p className="text-3xl font-bold tabular-nums">{analysisState.total_alerts || 0}</p>
                    <p className="text-sm text-muted-foreground">Threats Detected</p>
                  </div>
                  <div>
                    <Button onClick={resetAnalysis} size="lg">
                      New Analysis
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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Recent Alerts</CardTitle>
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {alerts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                      <ShieldAlert className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No alerts for this type</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-secondary rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        {alert.screenshot_b64 && (
                          <img
                            src={`data:image/jpeg;base64,${alert.screenshot_b64}`}
                            alt="Alert"
                            className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={alert.status === 'pending' ? 'destructive' : 'secondary'}
                              className="text-xs rounded-full"
                            >
                              {(alert.confidence * 100).toFixed(0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {alert.location}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {new Date(alert.created_at).toLocaleTimeString()}
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