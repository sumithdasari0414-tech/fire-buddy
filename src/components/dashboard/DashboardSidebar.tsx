import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Flame, LayoutDashboard, MapPin, Truck, Bell, MessageSquare, ShieldAlert, Activity, ChevronLeft, ChevronRight, Camera, Building, FileText, Navigation, Phone, PhoneCall } from 'lucide-react';

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number };

const navItems: NavItem[] = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
  { id: 'detection', label: 'Fire Detection', icon: Camera },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { id: 'location', label: 'Location Intel', icon: Navigation },
  { id: 'map', label: 'Live Map', icon: MapPin },
  { id: 'stations', label: 'Fire Stations', icon: Building },
  { id: 'vehicles', label: 'Fleet Tracker', icon: Truck },
  { id: 'callers', label: 'Caller Tracking', icon: Phone },
  { id: 'tollfree', label: 'Toll-Free Line', icon: PhoneCall },
  { id: 'history', label: 'Incident Logs', icon: FileText },
  { id: 'notifications', label: 'Alerts', icon: Bell, badge: 3 },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'safety', label: 'Safety Guide', icon: Activity },
];

export function DashboardSidebar({ activeTab, onTabChange, citySelector }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  citySelector?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20 glow-red flex-shrink-0">
          <Flame className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">FIREWATCH</span>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">HASSANTUK SYSTEM</span>
          </div>
        )}
      </div>

      {/* City selector */}
      {!collapsed && citySelector && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          {citySelector}
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 mt-2 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
              activeTab === item.id
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className={cn('w-4 h-4 flex-shrink-0', activeTab === item.id && 'text-primary')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.badge && !collapsed && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10', !collapsed && 'justify-between')}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            {!collapsed && <span className="text-xs font-mono text-success">24/7 ONLINE</span>}
          </div>
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
