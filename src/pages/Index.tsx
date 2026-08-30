import { useState, useCallback } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { CommandOverview } from '@/components/dashboard/CommandOverview';
import { IncidentPanel } from '@/components/dashboard/IncidentPanel';
import { IncidentMap } from '@/components/dashboard/IncidentMap';
import { VehicleTracker } from '@/components/dashboard/VehicleTracker';
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';
import { EmergencyChat } from '@/components/dashboard/EmergencyChat';
import { SafetyGuide } from '@/components/dashboard/SafetyGuide';
import { FireDetectionPanel } from '@/components/dashboard/FireDetectionPanel';
import { NearestStationsPanel } from '@/components/dashboard/NearestStationsPanel';
import { IncidentHistoryPanel } from '@/components/dashboard/IncidentHistoryPanel';
import { LocationPanel } from '@/components/dashboard/LocationPanel';
import { CallerTrackingPanel } from '@/components/dashboard/CallerTrackingPanel';
import { TollFreeCenter } from '@/components/dashboard/TollFreeCenter';
import { CitySelector } from '@/components/dashboard/CitySelector';
import { SosAlertsPanel } from '@/components/dashboard/SosAlertsPanel';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ConnectionStatusBanner } from '@/components/dashboard/ConnectionStatusBanner';
import { setCurrentCity, getCurrentCity, CityKey } from '@/data/mockData';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIncident, setSelectedIncident] = useState<string>('INC-001');
  const [city, setCity] = useState<CityKey>(getCurrentCity());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCityChange = useCallback((newCity: CityKey) => {
    setCurrentCity(newCity);
    setCity(newCity);
    setSelectedIncident('INC-001');
    setRefreshKey(k => k + 1);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CommandOverview key={refreshKey} onSelectIncident={setSelectedIncident} onNavigate={setActiveTab} />;
      case 'sos':
        return <SosAlertsPanel />;
      case 'detection':
        return <FireDetectionPanel demoMode />;
      case 'incidents':
        return <IncidentPanel key={refreshKey} selectedId={selectedIncident} onSelect={setSelectedIncident} />;
      case 'location':
        return <LocationPanel key={refreshKey} incidentId={selectedIncident} />;
      case 'map':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold tracking-tight">LIVE TACTICAL MAP</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">Real-time incident & vehicle positions</p>
            </div>
            <div className="flex-1 p-4">
              <IncidentMap key={refreshKey} onSelectIncident={(id) => { setSelectedIncident(id); setActiveTab('incidents'); }} />
            </div>
          </div>
        );
      case 'stations':
        return <NearestStationsPanel key={refreshKey} incidentId={selectedIncident} />;
      case 'vehicles':
        return <VehicleTracker key={refreshKey} />;
      case 'callers':
        return <CallerTrackingPanel key={refreshKey} />;
      case 'tollfree':
        return <TollFreeCenter key={refreshKey} />;
      case 'history':
        return <IncidentHistoryPanel key={refreshKey} />;
      case 'notifications':
        return <NotificationCenter key={refreshKey} />;
      case 'chat':
        return <EmergencyChat />;
      case 'safety':
        return <SafetyGuide />;
      default:
        return <CommandOverview key={refreshKey} onSelectIncident={setSelectedIncident} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background scanline">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        citySelector={
          <div className="space-y-2">
            <CitySelector currentCity={city} onCityChange={handleCityChange} />
            <LanguageSelector compact />
          </div>
        }
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <ConnectionStatusBanner />
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
