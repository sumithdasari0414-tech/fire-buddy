import { motion } from 'framer-motion';
import { emergencyPrecautions, emergencyExits } from '@/data/mockData';
import { DoorOpen, ShieldCheck } from 'lucide-react';

export function SafetyGuide() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-tight">SAFETY & EMERGENCY PROCEDURES</h2>
        <p className="text-xs text-muted-foreground mt-1">Offline safety guide — no network required</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Emergency Exits */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DoorOpen className="w-4 h-4 text-success" />
            <h3 className="text-sm font-bold">EMERGENCY EXITS</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyExits.map((floor, i) => (
              <motion.div
                key={floor.floor}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-secondary rounded-lg p-3 border border-border"
              >
                <p className="text-xs font-mono font-bold text-success mb-2">{floor.floor}</p>
                <ul className="space-y-1">
                  {floor.exits.map((exit) => (
                    <li key={exit} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-success flex-shrink-0" />
                      {exit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Precautions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-bold">PRECAUTIONS & FIRST AID</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyPrecautions.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-secondary rounded-lg p-3 border border-border"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm font-bold">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
