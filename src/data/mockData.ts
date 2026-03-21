export interface Incident {
  id: string;
  type: 'fire' | 'medical' | 'hazmat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    street: string;
    city: string;
    pincode: string;
  };
  reportedAt: string;
  timestamp: string;
  status: 'active' | 'dispatched' | 'resolved';
  description: string;
  falseAlarmScore: number;
  spreadPrediction: 'contained' | 'slow' | 'moderate' | 'rapid';
  affectedArea: string;
  buildingType: string;
  detectionSource: 'camera' | 'sensor' | 'manual' | 'phone';
  humansDetected: number;
  aiRecommendation: string;
}

export interface Vehicle {
  id: string;
  type: 'fire_engine' | 'ambulance' | 'police';
  callsign: string;
  status: 'available' | 'en_route' | 'on_scene' | 'returning';
  location: { lat: number; lng: number };
  eta?: string;
  assignedIncident?: string;
  speed: number;
}

export interface Notification {
  id: string;
  type: 'alert' | 'dispatch' | 'update' | 'resolved';
  message: string;
  time: string;
  read: boolean;
}

export interface FireStation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  phone: string;
  engines: number;
  ambulances: number;
  status: 'operational' | 'busy' | 'offline';
}

export interface IncidentLog {
  id: string;
  incidentId: string;
  timestamp: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'detected' | 'alerted' | 'dispatched' | 'contained' | 'resolved' | 'false_alarm';
  responseTime?: string;
  details: string;
}

export interface DetectionState {
  isFireDetected: boolean;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'none';
  fireIntensity: number; // 0-100
  smokeLevel: number; // 0-100
  humansDetected: number;
  persistenceSeconds: number;
  falseAlarmScore: number;
  spreadRate: 'none' | 'contained' | 'slow' | 'moderate' | 'rapid';
  cameraStatus: 'online' | 'offline' | 'processing';
  lastDetection: string;
}

export const fireStations: FireStation[] = [
  { id: 'FS-01', name: 'Central Delhi Fire Station', location: { lat: 28.6280, lng: 77.2190 }, address: 'Connaught Place, New Delhi 110001', phone: '+91-11-2336-1301', engines: 4, ambulances: 2, status: 'operational' },
  { id: 'FS-02', name: 'Kashmere Gate Fire Station', location: { lat: 28.6670, lng: 77.2280 }, address: 'Kashmere Gate, New Delhi 110006', phone: '+91-11-2386-5101', engines: 3, ambulances: 1, status: 'operational' },
  { id: 'FS-03', name: 'Sarojini Nagar Fire Station', location: { lat: 28.5740, lng: 77.2020 }, address: 'Sarojini Nagar, New Delhi 110023', phone: '+91-11-2411-2301', engines: 3, ambulances: 2, status: 'busy' },
  { id: 'FS-04', name: 'Patel Nagar Fire Station', location: { lat: 28.6510, lng: 77.1630 }, address: 'Patel Nagar, New Delhi 110008', phone: '+91-11-2578-4201', engines: 2, ambulances: 1, status: 'operational' },
  { id: 'FS-05', name: 'Janakpuri Fire Station', location: { lat: 28.6200, lng: 77.0900 }, address: 'Janakpuri, New Delhi 110058', phone: '+91-11-2553-1101', engines: 3, ambulances: 2, status: 'operational' },
  { id: 'FS-06', name: 'Lajpat Nagar Fire Station', location: { lat: 28.5700, lng: 77.2400 }, address: 'Lajpat Nagar, New Delhi 110024', phone: '+91-11-2634-2101', engines: 2, ambulances: 1, status: 'operational' },
];

export const incidentLogs: IncidentLog[] = [
  { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-21 17:12:04', event: 'Fire detected by Camera 3', severity: 'critical', location: '42 Connaught Place', status: 'detected', details: 'Smoke and flames detected on 3rd floor. AI confidence: 96%.' },
  { id: 'LOG-002', incidentId: 'INC-001', timestamp: '2026-03-21 17:12:08', event: 'Alert sent to Central Delhi Station', severity: 'critical', location: '42 Connaught Place', status: 'alerted', details: 'Auto-alert dispatched via SMS and radio. Response team notified.' },
  { id: 'LOG-003', incidentId: 'INC-001', timestamp: '2026-03-21 17:12:15', event: 'ENGINE 7, MEDIC 3, PATROL 9 dispatched', severity: 'critical', location: '42 Connaught Place', status: 'dispatched', responseTime: '11 sec', details: '3 units dispatched. ETA 3-5 minutes.' },
  { id: 'LOG-004', incidentId: 'INC-002', timestamp: '2026-03-21 17:06:22', event: 'Fire detected by Sensor Array B', severity: 'medium', location: '15 Kashmere Gate', status: 'detected', details: 'Heat sensor triggered. Camera confirmed kitchen fire.' },
  { id: 'LOG-005', incidentId: 'INC-002', timestamp: '2026-03-21 17:06:30', event: 'ENGINE 12 dispatched', severity: 'medium', location: '15 Kashmere Gate', status: 'dispatched', responseTime: '8 sec', details: 'Single engine unit deployed. Low spread risk.' },
  { id: 'LOG-006', incidentId: 'INC-002', timestamp: '2026-03-21 17:09:45', event: 'Fire contained', severity: 'medium', location: '15 Kashmere Gate', status: 'contained', responseTime: '3 min 23 sec', details: 'Fire confined to kitchen. No injuries reported.' },
  { id: 'LOG-007', incidentId: 'INC-003', timestamp: '2026-03-21 16:59:10', event: 'Fire detected by Camera 7', severity: 'high', location: '88 Sarojini Nagar Market', status: 'detected', details: 'Large fire in warehouse. Combustible materials nearby.' },
  { id: 'LOG-008', incidentId: 'INC-004', timestamp: '2026-03-21 16:49:33', event: 'Possible fire detected', severity: 'low', location: '3 Patel Nagar West', status: 'detected', details: 'Small heat signature. False alarm probability: 65%. Verification pending.' },
  { id: 'LOG-009', incidentId: 'INC-004', timestamp: '2026-03-21 16:50:01', event: 'False alarm analysis triggered', severity: 'low', location: '3 Patel Nagar West', status: 'detected', details: 'AI filtering active — small electrical anomaly. Monitoring continued.' },
  { id: 'LOG-010', incidentId: 'INC-005', timestamp: '2026-03-21 15:30:00', event: 'Smoke detected — resolved as false alarm', severity: 'low', location: '12 Dwarka Sector 7', status: 'false_alarm', details: 'Cooking smoke from kitchen vent. No fire. AI correctly identified after 4 seconds.' },
];

export const mockIncidents: Incident[] = [
  {
    id: 'INC-001', type: 'fire', severity: 'critical',
    location: { lat: 28.6139, lng: 77.2090, street: '42 Connaught Place', city: 'New Delhi', pincode: '110001' },
    reportedAt: '2 min ago', timestamp: '2026-03-21 17:12:04', status: 'active',
    description: 'Structure fire reported on 3rd floor of commercial building. Smoke visible from street level.',
    falseAlarmScore: 8, spreadPrediction: 'rapid', affectedArea: '~2,400 sq ft', buildingType: 'Commercial - 5 floors',
    detectionSource: 'camera', humansDetected: 12, aiRecommendation: 'Immediate evacuation required. Deploy 3+ units. Aerial ladder recommended for 3rd floor access.',
  },
  {
    id: 'INC-002', type: 'fire', severity: 'medium',
    location: { lat: 28.6304, lng: 77.2177, street: '15 Kashmere Gate', city: 'New Delhi', pincode: '110006' },
    reportedAt: '8 min ago', timestamp: '2026-03-21 17:06:22', status: 'dispatched',
    description: 'Kitchen fire in residential apartment. Single unit affected.',
    falseAlarmScore: 22, spreadPrediction: 'contained', affectedArea: '~400 sq ft', buildingType: 'Residential - 3 floors',
    detectionSource: 'sensor', humansDetected: 3, aiRecommendation: 'Fire containable. Recommend fire extinguisher use if safe. Single engine sufficient.',
  },
  {
    id: 'INC-003', type: 'fire', severity: 'high',
    location: { lat: 28.5672, lng: 77.2100, street: '88 Sarojini Nagar Market', city: 'New Delhi', pincode: '110023' },
    reportedAt: '15 min ago', timestamp: '2026-03-21 16:59:10', status: 'dispatched',
    description: 'Fire in warehouse storage area. Multiple combustible materials present.',
    falseAlarmScore: 5, spreadPrediction: 'moderate', affectedArea: '~5,000 sq ft', buildingType: 'Warehouse - Single story',
    detectionSource: 'camera', humansDetected: 0, aiRecommendation: 'No humans detected. Focus on containment. Risk of chemical fumes — hazmat team advisable.',
  },
  {
    id: 'INC-004', type: 'fire', severity: 'low',
    location: { lat: 28.6448, lng: 77.1695, street: '3 Patel Nagar West', city: 'New Delhi', pincode: '110008' },
    reportedAt: '25 min ago', timestamp: '2026-03-21 16:49:33', status: 'active',
    description: 'Small electrical fire in utility room. Occupants evacuated safely.',
    falseAlarmScore: 65, spreadPrediction: 'contained', affectedArea: '~100 sq ft', buildingType: 'Office Building - 8 floors',
    detectionSource: 'sensor', humansDetected: 0, aiRecommendation: 'High false alarm probability. Verify with on-site inspection. Electrical isolation recommended.',
  },
];

export const mockVehicles: Vehicle[] = [
  { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE 7', status: 'en_route', location: { lat: 28.6200, lng: 77.2050 }, eta: '3 min', assignedIncident: 'INC-001', speed: 45 },
  { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE 12', status: 'on_scene', location: { lat: 28.6304, lng: 77.2177 }, assignedIncident: 'INC-002', speed: 0 },
  { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC 3', status: 'en_route', location: { lat: 28.6180, lng: 77.2120 }, eta: '5 min', assignedIncident: 'INC-001', speed: 52 },
  { id: 'POL-01', type: 'police', callsign: 'PATROL 9', status: 'en_route', location: { lat: 28.6100, lng: 77.2150 }, eta: '2 min', assignedIncident: 'INC-001', speed: 60 },
  { id: 'FE-03', type: 'fire_engine', callsign: 'ENGINE 4', status: 'available', location: { lat: 28.5800, lng: 77.2300 }, speed: 0 },
  { id: 'AMB-02', type: 'ambulance', callsign: 'MEDIC 8', status: 'en_route', location: { lat: 28.5700, lng: 77.2050 }, eta: '7 min', assignedIncident: 'INC-003', speed: 38 },
  { id: 'POL-02', type: 'police', callsign: 'PATROL 14', status: 'available', location: { lat: 28.6500, lng: 77.1800 }, speed: 0 },
];

export const mockNotifications: Notification[] = [
  { id: 'N1', type: 'alert', message: 'CRITICAL: Structure fire at 42 Connaught Place — immediate response required', time: '2 min ago', read: false },
  { id: 'N2', type: 'dispatch', message: 'ENGINE 7, MEDIC 3, PATROL 9 dispatched to INC-001', time: '2 min ago', read: false },
  { id: 'N3', type: 'update', message: 'INC-002: Fire contained to single apartment unit', time: '5 min ago', read: true },
  { id: 'N4', type: 'dispatch', message: 'ENGINE 12 arrived on scene at INC-002', time: '6 min ago', read: true },
  { id: 'N5', type: 'alert', message: 'HIGH: Warehouse fire at Sarojini Nagar — combustible materials', time: '15 min ago', read: true },
  { id: 'N6', type: 'update', message: 'False alarm probability 65% for INC-004 — verification recommended', time: '20 min ago', read: true },
];

export const emergencyExits = [
  { floor: 'Ground', exits: ['Main entrance (North)', 'Service exit (East)', 'Fire escape stairwell A'] },
  { floor: '1st Floor', exits: ['Stairwell A (North)', 'Stairwell B (South)', 'Fire escape ladder (West)'] },
  { floor: '2nd Floor', exits: ['Stairwell A (North)', 'Stairwell B (South)'] },
  { floor: '3rd Floor', exits: ['Stairwell A (North)', 'Stairwell B (South)', 'Roof access'] },
];

export const emergencyPrecautions = [
  { title: 'Stop, Drop & Roll', description: 'If your clothes catch fire, stop moving, drop to the ground, and roll to extinguish flames.', icon: '🔥' },
  { title: 'Stay Low', description: 'Smoke rises. Crawl on hands and knees below the smoke level to avoid inhaling toxic fumes.', icon: '⬇️' },
  { title: 'Feel Doors First', description: 'Before opening any door, feel it with the back of your hand. If hot, do not open — find an alternate route.', icon: '🚪' },
  { title: 'Cover Your Mouth', description: 'Use a wet cloth or towel to cover nose and mouth. This filters smoke particles.', icon: '😷' },
  { title: 'Do Not Use Elevators', description: 'Always use stairways during a fire. Elevators may malfunction or open on the fire floor.', icon: '🚫' },
  { title: 'Close Doors Behind You', description: 'Closing doors as you leave slows fire spread and can save lives.', icon: '🚪' },
  { title: 'Signal From Window', description: 'If trapped, close the door, seal gaps with wet cloth, and signal from a window.', icon: '🪟' },
  { title: 'Basic First Aid', description: 'For burns: cool under running water 10+ min. Do not apply ice, butter or adhesive bandages.', icon: '🩹' },
];

// Utility functions
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function getEstimatedResponseTime(distanceKm: number): string {
  const avgSpeedKmh = 40;
  const minutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);
  return `${minutes} min`;
}

export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
