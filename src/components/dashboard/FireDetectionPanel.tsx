import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import { Camera, CameraOff, Flame, Users, Wind, AlertTriangle, Eye, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { DetectionState } from '@/data/mockData';

const INITIAL_STATE: DetectionState = {
  isFireDetected: false, confidence: 0, severity: 'none', fireIntensity: 0,
  smokeLevel: 0, humansDetected: 0, persistenceSeconds: 0, falseAlarmScore: 0,
  spreadRate: 'none', cameraStatus: 'online', lastDetection: 'N/A',
};

export function FireDetectionPanel({ onFireDetected, demoMode }: {
  onFireDetected?: (state: DetectionState) => void;
  demoMode?: boolean;
}) {
  const [state, setState] = useState<DetectionState>(INITIAL_STATE);
  const [isSimulating, setIsSimulating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmRef = useRef<{ stop: () => void } | null>(null);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceEnabled]);

  const startAlarm = useCallback(() => {
    if (alarmPlaying) return;
    setAlarmPlaying(true);
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);

      // Create siren effect
      const now = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        oscillator.frequency.setValueAtTime(800, now + i * 0.5);
        oscillator.frequency.linearRampToValueAtTime(1200, now + i * 0.5 + 0.25);
        oscillator.frequency.linearRampToValueAtTime(800, now + i * 0.5 + 0.5);
      }
      oscillator.start();

      alarmRef.current = {
        stop: () => {
          try {
            oscillator.stop();
            ctx.close();
          } catch {}
          setAlarmPlaying(false);
        }
      };

      setTimeout(() => alarmRef.current?.stop(), 5000);
    } catch {}
  }, [alarmPlaying]);

  const stopAlarm = useCallback(() => {
    alarmRef.current?.stop();
    alarmRef.current = null;
    setAlarmPlaying(false);
  }, []);

  const triggerDetection = useCallback(() => {
    setIsSimulating(true);
    let tick = 0;

    intervalRef.current = setInterval(() => {
      tick++;
      const persistence = tick;
      const fireIntensity = Math.min(95, 20 + tick * 8 + Math.random() * 10);
      const smokeLevel = Math.min(90, 10 + tick * 6 + Math.random() * 8);
      const confidence = Math.min(98, 40 + tick * 7);
      const falseAlarm = Math.max(2, 60 - tick * 8);

      let severity: DetectionState['severity'] = 'low';
      if (fireIntensity > 70) severity = 'critical';
      else if (fireIntensity > 50) severity = 'high';
      else if (fireIntensity > 30) severity = 'medium';

      let spreadRate: DetectionState['spreadRate'] = 'contained';
      if (fireIntensity > 70) spreadRate = 'rapid';
      else if (fireIntensity > 50) spreadRate = 'moderate';
      else if (fireIntensity > 30) spreadRate = 'slow';

      const newState: DetectionState = {
        isFireDetected: true, confidence, severity, fireIntensity, smokeLevel,
        humansDetected: Math.floor(Math.random() * 5) + 1,
        persistenceSeconds: persistence,
        falseAlarmScore: falseAlarm, spreadRate,
        cameraStatus: 'processing',
        lastDetection: new Date().toLocaleTimeString(),
      };

      setState(newState);
      onFireDetected?.(newState);

      // Voice alerts at key moments
      if (tick === 2) {
        speak('Warning. Fire detected. Analyzing severity.');
        startAlarm();
      }
      if (tick === 4) speak('Fire confirmed. Severity escalating. Please evacuate immediately.');
      if (tick === 6) speak('Emergency services have been notified. Help is on the way. Stay calm and move to the nearest exit.');

      if (tick >= 10) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsSimulating(false);
      }
    }, 1000);
  }, [onFireDetected, speak, startAlarm]);

  const resetDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSimulating(false);
    stopAlarm();
    setState(INITIAL_STATE);
    speak('All clear. Fire detection system reset. Monitoring resumed.');
  }, [stopAlarm, speak]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAlarm();
    };
  }, [stopAlarm]);

  const severityVariant = state.severity === 'none' ? 'success' : state.severity === 'low' ? 'info' : state.severity === 'medium' ? 'warning' : 'critical';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-info" />
          <h2 className="text-sm font-bold tracking-tight">FIRE DETECTION SYSTEM</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-1.5 rounded bg-secondary hover:bg-muted transition-colors">
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-success" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <StatusBadge variant={state.cameraStatus === 'online' ? 'success' : state.cameraStatus === 'processing' ? 'warning' : 'critical'}>
            CAM {state.cameraStatus}
          </StatusBadge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Camera Feed Simulation */}
        <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden border border-border">
          <div className="absolute inset-0 grid-pattern opacity-30" />

          {/* Simulated camera view */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!state.isFireDetected ? (
              <div className="text-center">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-xs font-mono text-muted-foreground">CAMERA FEED — MONITORING</p>
                <p className="text-[10px] text-muted-foreground mt-1">No fire detected</p>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-center"
              >
                <Flame className="w-16 h-16 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold font-mono text-primary">🔥 FIRE DETECTED 🔥</p>
              </motion.div>
            )}
          </div>

          {/* Camera overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${state.isFireDetected ? 'bg-critical animate-pulse' : 'bg-success'}`} />
            <span className="text-[10px] font-mono text-foreground bg-background/60 px-1 rounded">CAM-03</span>
          </div>
          <div className="absolute top-2 right-2 text-[10px] font-mono text-foreground bg-background/60 px-1.5 py-0.5 rounded">
            {new Date().toLocaleTimeString()}
          </div>

          {/* Detection bounding box */}
          {state.isFireDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-primary rounded-sm"
            >
              <span className="absolute -top-5 left-0 text-[9px] font-mono bg-primary text-primary-foreground px-1 rounded">
                FIRE {state.confidence.toFixed(0)}%
              </span>
            </motion.div>
          )}

          {/* Humans detected marker */}
          {state.isFireDetected && state.humansDetected > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-warning/80 rounded px-1.5 py-0.5">
              <Users className="w-3 h-3 text-warning-foreground" />
              <span className="text-[10px] font-bold text-warning-foreground">{state.humansDetected} humans</span>
            </div>
          )}
        </div>

        {/* Status Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.isFireDetected ? 'fire' : 'safe'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`rounded-lg p-4 text-center ${state.isFireDetected ? 'bg-critical/20 border border-critical/40 glow-red' : 'bg-success/10 border border-success/30'}`}
          >
            <p className={`text-lg font-bold font-mono ${state.isFireDetected ? 'text-critical' : 'text-success'}`}>
              {state.isFireDetected ? '🚨 FIRE DETECTED — EMERGENCY 🚨' : '✅ SAFE — NO FIRE DETECTED'}
            </p>
            {state.isFireDetected && (
              <p className="text-xs text-muted-foreground mt-1">
                Emergency services notified • Persistence: {state.persistenceSeconds}s • Confidence: {state.confidence.toFixed(0)}%
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Detection Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard label="Fire Intensity" value={`${state.fireIntensity.toFixed(0)}%`} bar={state.fireIntensity} color={state.fireIntensity > 60 ? 'bg-critical' : state.fireIntensity > 30 ? 'bg-warning' : 'bg-success'} />
          <MetricCard label="Smoke Level" value={`${state.smokeLevel.toFixed(0)}%`} bar={state.smokeLevel} color={state.smokeLevel > 50 ? 'bg-critical' : 'bg-warning'} />
          <MetricCard label="AI Confidence" value={`${state.confidence.toFixed(0)}%`} bar={state.confidence} color="bg-info" />
          <MetricCard label="False Alarm" value={`${state.falseAlarmScore.toFixed(0)}%`} bar={state.falseAlarmScore} color={state.falseAlarmScore > 40 ? 'bg-warning' : 'bg-success'} />
          <MetricCard label="Persistence" value={`${state.persistenceSeconds}s`} bar={Math.min(state.persistenceSeconds * 10, 100)} color="bg-info" />
          <div className="bg-secondary rounded-lg p-2.5 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Severity</p>
            <div className="mt-1">
              <StatusBadge variant={severityVariant} pulse={state.severity === 'critical'}>
                {state.severity === 'none' ? 'SAFE' : state.severity}
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* Spread Rate */}
        {state.isFireDetected && (
          <div className="bg-secondary rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Fire Spread Prediction</span>
              </div>
              <StatusBadge variant={state.spreadRate === 'rapid' ? 'critical' : state.spreadRate === 'moderate' ? 'warning' : 'info'}>
                {state.spreadRate}
              </StatusBadge>
            </div>
            <div className="flex gap-1">
              {['contained', 'slow', 'moderate', 'rapid'].map((level, i) => (
                <div key={level} className={`flex-1 h-2 rounded-full ${
                  ['contained', 'slow', 'moderate', 'rapid'].indexOf(state.spreadRate) >= i
                    ? i === 3 ? 'bg-critical' : i === 2 ? 'bg-warning' : i === 1 ? 'bg-info' : 'bg-success'
                    : 'bg-muted'
                }`} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['contained', 'slow', 'moderate', 'rapid'].map(l => (
                <span key={l} className="text-[8px] text-muted-foreground capitalize">{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {state.isFireDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary/10 border border-primary/30 rounded-lg p-3"
          >
            <p className="text-[10px] font-mono text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> AI RECOMMENDATION
            </p>
            <p className="text-sm text-foreground">
              {state.severity === 'critical'
                ? 'Immediate evacuation required. Deploy multiple units. Aerial ladder may be needed.'
                : state.severity === 'high'
                ? 'Deploy fire suppression team. Check for combustible materials nearby.'
                : state.severity === 'medium'
                ? 'Fire may be containable. Use extinguisher if safe. Single unit sufficient.'
                : 'Monitor closely. Verify with on-site inspection. Low threat level.'}
            </p>
          </motion.div>
        )}

        {/* Demo Controls */}
        <div className="flex gap-2">
          <button
            onClick={triggerDetection}
            disabled={isSimulating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-30 transition-opacity font-mono text-sm"
          >
            <Play className="w-4 h-4" />
            {isSimulating ? 'SIMULATING...' : 'TRIGGER DETECTION'}
          </button>
          <button
            onClick={resetDetection}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-mono text-sm"
          >
            <Pause className="w-4 h-4" />
            RESET
          </button>
        </div>

        {alarmPlaying && (
          <button onClick={stopAlarm} className="w-full py-2 bg-critical/20 border border-critical/40 rounded-lg text-critical text-sm font-mono hover:bg-critical/30 transition-colors">
            🔇 STOP ALARM
          </button>
        )}

        {/* Human Safety Messages */}
        {state.isFireDetected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-success">💚 Help is on the way</p>
              <p className="text-xs text-muted-foreground mt-1">Emergency services have been notified and are responding.</p>
            </div>
            <div className="bg-info/10 border border-info/30 rounded-lg p-3">
              <p className="text-xs font-bold text-info mb-1">🧘 Stay Calm — Follow These Steps:</p>
              <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                <li>Stay low and move to the nearest exit</li>
                <li>Cover your nose and mouth with a wet cloth</li>
                <li>Do not use elevators</li>
                <li>Close doors behind you as you leave</li>
                <li>Once outside, move away from the building</li>
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, bar, color }: { label: string; value: string; bar: number; color: string }) {
  return (
    <div className="bg-secondary rounded-lg p-2.5 border border-border">
      <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${bar}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
