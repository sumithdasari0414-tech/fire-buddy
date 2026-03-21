import { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { CommandOverview } from '@/components/dashboard/CommandOverview';
import { IncidentPanel } from '@/components/dashboard/IncidentPanel';
import { IncidentMap } from '@/components/dashboard/IncidentMap';
import { VehicleTracker } from '@/components/dashboard/VehicleTracker';
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';
import { EmergencyChat } from '@/components/dashboard/EmergencyChat';
import { SafetyGuide } from '@/components/dashboard/SafetyGuide';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIncident, setSelectedIncident] = useState<string>('');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CommandOverview onSelectIncident={setSelectedIncident} onNavigate={setActiveTab} />;
      case 'incidents':
        return <IncidentPanel selectedId={selectedIncident} onSelect={setSelectedIncident} />;
      case 'map':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold tracking-tight">LIVE TACTICAL MAP</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">Real-time incident & vehicle positions</p>
            </div>
            <div className="flex-1 p-4">
              <IncidentMap onSelectIncident={(id) => { setSelectedIncident(id); setActiveTab('incidents'); }} />
            </div>
          </div>
        );
      case 'vehicles':
        return <VehicleTracker />;
      case 'notifications':
        return <NotificationCenter />;
      case 'chat':
        return <EmergencyChat />;
      case 'safety':
        return <SafetyGuide />;
      default:
        return <CommandOverview onSelectIncident={setSelectedIncident} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background scanline">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
