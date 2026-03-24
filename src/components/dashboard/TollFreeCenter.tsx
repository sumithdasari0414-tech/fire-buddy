import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCallers, getGoogleMapsLink, EmergencyCaller, getCurrentCity, indianCities } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOff, MapPin, Clock, ExternalLink,
  Copy, Navigation, Signal, Radio, User, AlertTriangle, Volume2, Mic,
  PhoneForwarded, Shield
} from 'lucide-react';
import { toast } from 'sonner';

const TOLL_FREE_NUMBER = '1800-120-FIRE';
const TOLL_FREE_DISPLAY = '1800-120-3473';

type CallState = 'idle' | 'ringing' | 'connected' | 'tracing' | 'traced';

export function TollFreeCenter() {
  const [callers, setCallers] = useState<EmergencyCaller[]>(getCallers());
  const [selectedCaller, setSelectedCaller] = useState<string>(callers[0]?.id || '');
  const [callState, setCallState] = useState<CallState>('idle');
  const [simulatedCall, setSimulatedCall] = useState<EmergencyCaller | null>(null);
  const [traceProgress, setTraceProgress] = useState(0);
  const [callQueue, setCallQueue] = useState<number>(2);
  const [totalCalls, setTotalCalls] = useState(callers.length);
  const [isRinging, setIsRinging] = useState(false);
  const ringRef = useRef<ReturnType<typeof setInterval>>();

  const city = indianCities.find(c => c.key === getCurrentCity());

  useEffect(() => {
    const data = getCallers();
    setCallers(data);
    if (data.length > 0) setSelectedCaller(data[0].id);
  }, []);

  const activeCaller = callers.find(c => c.id === selectedCaller) || callers[0];

  const copyCoords = () => {
    if (!activeCaller) return;
    navigator.clipboard.writeText(`${activeCaller.location.lat}, ${activeCaller.location.lng}`);
    toast.success('Coordinates copied to clipboard');
  };

  // Simulate incoming call
  const simulateIncomingCall = () => {
    if (callState !== 'idle') return;
    setIsRinging(true);
    setCallState('ringing');
    
    // Create a random simulated caller
    const names = ['Rajesh Kumar', 'Priya Sharma', 'Mohammed Ali', 'Lakshmi Devi', 'Sanjay Patel'];
    const phones = ['+91 9876543210', '+91 8765432109', '+91 7654321098', '+91 6543210987', '+91 9988776655'];
    const idx = Math.floor(Math.random() * names.length);
    
    const newCaller: EmergencyCaller = {
      id: `CALL-${String(totalCalls + 1).padStart(3, '0')}`,
      name: names[idx],
      phone: phones[idx],
      location: {
        lat: (city?.center.lat || 17.385) + (Math.random() - 0.5) * 0.05,
        lng: (city?.center.lng || 78.4867) + (Math.random() - 0.5) * 0.05,
      },
      address: `${Math.floor(Math.random() * 500) + 1}, ${['MG Road', 'Jubilee Hills', 'Banjara Hills', 'Ameerpet', 'Begumpet'][Math.floor(Math.random() * 5)]}, ${city?.name || 'Hyderabad'}`,
      callTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      duration: '00:00',
      status: 'active',
      severity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as any,
      description: 'Incoming emergency call — location trace in progress...',
      locationType: Math.random() > 0.4 ? 'gps' : 'tower',
      accuracy: Math.random() > 0.4 ? '±5m' : '±50m',
    };
    
    setSimulatedCall(newCaller);
    
    // Auto-ring for 5 seconds
    ringRef.current = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 500);
  };

  const answerCall = () => {
    if (callState !== 'ringing' || !simulatedCall) return;
    clearInterval(ringRef.current);
    setIsRinging(false);
    setCallState('connected');
    toast.success('Call connected — initiating location trace');
    
    // Start tracing after 1 second
    setTimeout(() => {
      setCallState('tracing');
      setTraceProgress(0);
    }, 1000);
  };

  // Trace progress animation
  useEffect(() => {
    if (callState !== 'tracing') return;
    const interval = setInterval(() => {
      setTraceProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCallState('traced');
          if (simulatedCall) {
            setCallers(prev => [simulatedCall, ...prev]);
            setSelectedCaller(simulatedCall.id);
            setTotalCalls(t => t + 1);
            setCallQueue(q => Math.max(0, q - 1));
            toast.success(`Location traced: ${simulatedCall.address}`, { duration: 5000 });
          }
          return 100;
        }
        return prev + 4;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [callState]);

  const endCall = () => {
    clearInterval(ringRef.current);
    setCallState('idle');
    setSimulatedCall(null);
    setTraceProgress(0);
    setIsRinging(false);
  };

  const statusColors: Record<string, 'critical' | 'warning' | 'success' | 'info'> = {
    active: 'critical',
    on_hold: 'warning',
    completed: 'success',
    missed: 'info',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
            <Phone className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">TOLL-FREE EMERGENCY LINE</h2>
            <p className="text-xs font-mono text-muted-foreground">{TOLL_FREE_DISPLAY} ({TOLL_FREE_NUMBER})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant="info">{totalCalls} TOTAL</StatusBadge>
          <StatusBadge variant="warning">{callQueue} QUEUE</StatusBadge>
          <StatusBadge variant="success" pulse>ACTIVE</StatusBadge>
        </div>
      </div>

      {/* Incoming call simulation bar */}
      <div className="p-3 border-b border-border bg-secondary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">SIMULATION MODE — {city?.name?.toUpperCase()} SECTOR</span>
          </div>

          <AnimatePresence mode="wait">
            {callState === 'idle' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={simulateIncomingCall}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-mono hover:bg-primary/30 transition-colors"
              >
                <PhoneIncoming className="w-3.5 h-3.5" />
                SIMULATE INCOMING CALL
              </motion.button>
            )}
            
            {callState === 'ringing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: isRinging ? [1, 1.15, 1] : 1, rotate: isRinging ? [0, -10, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-8 h-8 rounded-full bg-success/20 border border-success/40 flex items-center justify-center"
                >
                  <PhoneCall className="w-4 h-4 text-success" />
                </motion.div>
                <div>
                  <p className="text-xs font-bold text-success">INCOMING CALL</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{simulatedCall?.phone}</p>
                </div>
                <button onClick={answerCall} className="ml-2 px-3 py-1.5 bg-success/20 border border-success/30 rounded-lg text-success text-xs font-mono hover:bg-success/30 transition-colors">
                  ANSWER
                </button>
                <button onClick={endCall} className="px-3 py-1.5 bg-critical/20 border border-critical/30 rounded-lg text-critical text-xs font-mono hover:bg-critical/30 transition-colors">
                  REJECT
                </button>
              </motion.div>
            )}

            {(callState === 'connected' || callState === 'tracing') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-success animate-pulse" />
                  <span className="text-xs font-mono text-success">CONNECTED</span>
                </div>
                {callState === 'tracing' && (
                  <div className="flex items-center gap-2">
                    <Signal className="w-3.5 h-3.5 text-warning animate-pulse" />
                    <span className="text-xs font-mono text-warning">TRACING {traceProgress}%</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full bg-warning rounded-full" style={{ width: `${traceProgress}%` }} />
                    </div>
                  </div>
                )}
                <button onClick={endCall} className="px-3 py-1.5 bg-critical/20 border border-critical/30 rounded-lg text-critical text-xs font-mono hover:bg-critical/30 transition-colors">
                  <PhoneOff className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {callState === 'traced' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <Navigation className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-mono text-success">LOCATION LOCKED — DISPATCHING</span>
                <button onClick={endCall} className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-mono hover:bg-secondary transition-colors">
                  END CALL
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Call log list */}
        <div className="w-72 border-r border-border overflow-y-auto">
          <div className="p-3 border-b border-border bg-secondary/30">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">CALL LOG — {city?.name}</p>
          </div>
          {callers.map((caller) => (
            <button
              key={caller.id}
              onClick={() => setSelectedCaller(caller.id)}
              className={`w-full text-left p-3 border-b border-border transition-colors ${
                selectedCaller === caller.id
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{caller.id}</span>
                <StatusBadge variant={statusColors[caller.status]}>
                  {caller.status}
                </StatusBadge>
              </div>
              <p className="text-sm font-bold truncate">{caller.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{caller.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{caller.callTime} · {caller.duration}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Caller details */}
        {activeCaller ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Toll-free line info */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-bold">{TOLL_FREE_DISPLAY}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Toll-Free Emergency Hotline — {city?.name} {city?.state}</p>
                </div>
              </div>
              <StatusBadge variant="success" pulse>24/7 ACTIVE</StatusBadge>
            </div>

            {/* Caller identity */}
            <motion.div
              key={activeCaller.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary rounded-lg p-4 border border-border"
            >
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <User className="w-3 h-3" /> CALLER IDENTIFICATION
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Name</p>
                  <p className="text-sm font-bold">{activeCaller.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Phone</p>
                  <p className="text-sm font-bold font-mono">{activeCaller.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Call Time</p>
                  <p className="text-sm font-mono">{activeCaller.callTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Duration</p>
                  <p className="text-sm font-mono">{activeCaller.duration}</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-1">CALLER REPORT</p>
                <p className="text-xs leading-relaxed">{activeCaller.description}</p>
              </div>
            </motion.div>

            {/* Exact location — traced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-secondary rounded-lg p-4 border border-border"
            >
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> TRACED CALLER LOCATION
              </h3>

              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm font-bold">{activeCaller.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] font-mono text-muted-foreground">LATITUDE</p>
                  <p className="text-sm font-bold font-mono text-info">{activeCaller.location.lat.toFixed(6)}°N</p>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] font-mono text-muted-foreground">LONGITUDE</p>
                  <p className="text-sm font-bold font-mono text-info">{activeCaller.location.lng.toFixed(6)}°E</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] font-mono text-muted-foreground">TRACE METHOD</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {activeCaller.locationType === 'gps' ? (
                      <Signal className="w-3 h-3 text-success" />
                    ) : (
                      <Radio className="w-3 h-3 text-warning" />
                    )}
                    <p className="text-xs font-bold uppercase">{activeCaller.locationType === 'gps' ? 'GPS LOCK' : 'CELL TOWER'}</p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <p className="text-[10px] font-mono text-muted-foreground">ACCURACY</p>
                  <p className="text-sm font-bold font-mono text-success">{activeCaller.accuracy}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={getGoogleMapsLink(activeCaller.location.lat, activeCaller.location.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-info/20 border border-info/30 rounded-lg text-info text-xs font-mono hover:bg-info/30 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> OPEN IN GOOGLE MAPS
                </a>
                <button
                  onClick={copyCoords}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-mono hover:bg-muted transition-colors"
                >
                  <Copy className="w-3 h-3" /> COPY
                </button>
              </div>
            </motion.div>

            {/* Severity */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg p-4 border ${
                activeCaller.severity === 'critical' ? 'bg-critical/10 border-critical/30' :
                activeCaller.severity === 'high' ? 'bg-primary/10 border-primary/30' :
                activeCaller.severity === 'medium' ? 'bg-warning/10 border-warning/30' :
                'bg-info/10 border-info/30'
              }`}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> SEVERITY & AUTO-DISPATCH
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge variant={activeCaller.severity as any} pulse={activeCaller.severity === 'critical'}>
                  {activeCaller.severity.toUpperCase()}
                </StatusBadge>
                <span className="text-xs">
                  {activeCaller.severity === 'critical' ? 'All units dispatched — Code Red' :
                   activeCaller.severity === 'high' ? 'Fire engine + ambulance dispatched' :
                   activeCaller.severity === 'medium' ? 'Fire engine dispatched' :
                   'Verification call initiated'}
                </span>
              </div>
              <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <PhoneForwarded className="w-3 h-3 text-success" />
                  <span className="font-mono text-success">Auto-dispatch triggered for nearest station in {city?.name}</span>
                </div>
              </div>
            </motion.div>

            {/* Call trace log */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-secondary rounded-lg p-4 border border-border"
            >
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">CALL TRACE TIMELINE</h3>
              <div className="space-y-2">
                {[
                  { time: activeCaller.callTime, event: `Call received on ${TOLL_FREE_DISPLAY}`, detail: 'Toll-free line activated', icon: Phone },
                  { time: activeCaller.callTime, event: 'Caller ID captured', detail: `${activeCaller.phone} — ${activeCaller.name}`, icon: User },
                  { time: activeCaller.callTime, event: `${activeCaller.locationType === 'gps' ? 'GPS' : 'Cell tower'} trace initiated`, detail: `Accuracy: ${activeCaller.accuracy}`, icon: Signal },
                  { time: activeCaller.callTime, event: 'Location locked', detail: activeCaller.address, icon: MapPin },
                  { time: activeCaller.callTime, event: 'Auto-dispatch triggered', detail: `Severity: ${activeCaller.severity.toUpperCase()} — units en route`, icon: PhoneForwarded },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <span className="text-[10px] font-mono text-muted-foreground w-16 flex-shrink-0">{log.time}</span>
                    <log.icon className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{log.event}</p>
                      <p className="text-[10px] text-muted-foreground">{log.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm font-mono">No caller data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
