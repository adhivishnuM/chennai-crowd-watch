import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle2, AlertCircle, Play, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export default function AdminVideoUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const simulateUpload = () => {
    setStatus('uploading');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('processing');
          setTimeout(() => setStatus('complete'), 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const resetUpload = () => {
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Video Upload & Analysis</h1>
        <p className="text-muted-foreground">Upload video files for crowd detection analysis</p>
      </div>

      {/* Upload Area */}
      <motion.div
        className={`glass-card p-8 border-2 border-dashed transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateUpload(); }}
      >
        {status === 'idle' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Drop video file here</h3>
            <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
            <Button onClick={simulateUpload}>
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: MP4, AVI, MOV • Max size: 500MB
            </p>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <File className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-4">sample_video.mp4</h3>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  status === 'uploading' || status === 'processing' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm">Uploading</span>
              </div>
              <div className="w-8 h-0.5 bg-border" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  status === 'processing' ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary'
                }`}>
                  {status === 'processing' ? '2' : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className="text-sm">Processing</span>
              </div>
              <div className="w-8 h-0.5 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-secondary">
                  3
                </div>
                <span className="text-sm">Analyzing</span>
              </div>
            </div>

            <Progress value={status === 'processing' ? 100 : progress} className="max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              {status === 'uploading' ? `${progress}% uploaded` : 'Processing video...'}
            </p>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-crowd-low/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-crowd-low" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-muted-foreground text-sm mb-4">Your video has been processed successfully</p>
            <Button variant="secondary" onClick={resetUpload}>
              Upload Another
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
            <p className="text-muted-foreground text-sm mb-4">Something went wrong. Please try again.</p>
            <Button onClick={resetUpload}>
              Try Again
            </Button>
          </div>
        )}
      </motion.div>

      {/* Analysis Results (shown when complete) */}
      {status === 'complete' && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-semibold mb-4">Analysis Results</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Video Preview */}
            <div className="aspect-video bg-foreground/5 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">Video Preview</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">847</p>
                  <p className="text-xs text-muted-foreground">Avg Count</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-crowd-high">1,234</p>
                  <p className="text-xs text-muted-foreground">Peak Count</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-crowd-low">342</p>
                  <p className="text-xs text-muted-foreground">Low Count</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Frame Analysis</span>
                </div>
                <div className="h-24 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Chart placeholder</span>
                </div>
              </div>

              <Button className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download Report
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
