import { motion } from 'framer-motion';
import { getNotifications } from '@/data/mockData';
import { Bell, Truck, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const typeConfig = {
  alert: { icon: AlertTriangle, color: 'text-critical', bg: 'bg-critical/10' },
  dispatch: { icon: Truck, color: 'text-warning', bg: 'bg-warning/10' },
  update: { icon: RefreshCw, color: 'text-info', bg: 'bg-info/10' },
  resolved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
};

export function NotificationCenter() {
  const mockNotifications = getNotifications();
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-tight">NOTIFICATIONS</h2>
        <span className="text-xs font-mono text-muted-foreground">{mockNotifications.filter(n => !n.read).length} unread</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {mockNotifications.map((n, i) => {
          const config = typeConfig[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 transition-colors ${!n.read ? 'bg-secondary/30' : ''}`}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{n.time}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
