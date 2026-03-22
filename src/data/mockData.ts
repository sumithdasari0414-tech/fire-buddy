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
  fireIntensity: number;
  smokeLevel: number;
  humansDetected: number;
  persistenceSeconds: number;
  falseAlarmScore: number;
  spreadRate: 'none' | 'contained' | 'slow' | 'moderate' | 'rapid';
  cameraStatus: 'online' | 'offline' | 'processing';
  lastDetection: string;
}

export interface EmergencyCaller {
  id: string;
  name: string;
  phone: string;
  location: { lat: number; lng: number };
  address: string;
  callTime: string;
  duration: string;
  status: 'active' | 'on_hold' | 'completed' | 'missed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  locationType: 'gps' | 'tower' | 'manual';
  accuracy: string;
}

export type CityKey = 'hyderabad' | 'delhi' | 'mumbai' | 'bangalore' | 'chennai' | 'kolkata' | 'pune' | 'ahmedabad';

export interface CityConfig {
  key: CityKey;
  name: string;
  state: string;
  center: { lat: number; lng: number };
}

export const indianCities: CityConfig[] = [
  { key: 'hyderabad', name: 'Hyderabad', state: 'Telangana', center: { lat: 17.3850, lng: 78.4867 } },
  { key: 'delhi', name: 'New Delhi', state: 'Delhi', center: { lat: 28.6139, lng: 77.2090 } },
  { key: 'mumbai', name: 'Mumbai', state: 'Maharashtra', center: { lat: 19.0760, lng: 72.8777 } },
  { key: 'bangalore', name: 'Bengaluru', state: 'Karnataka', center: { lat: 12.9716, lng: 77.5946 } },
  { key: 'chennai', name: 'Chennai', state: 'Tamil Nadu', center: { lat: 13.0827, lng: 80.2707 } },
  { key: 'kolkata', name: 'Kolkata', state: 'West Bengal', center: { lat: 22.5726, lng: 88.3639 } },
  { key: 'pune', name: 'Pune', state: 'Maharashtra', center: { lat: 18.5204, lng: 73.8567 } },
  { key: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', center: { lat: 23.0225, lng: 72.5714 } },
];

// ===== CITY-SPECIFIC DATA =====

const cityData: Record<CityKey, {
  incidents: Incident[];
  vehicles: Vehicle[];
  stations: FireStation[];
  notifications: Notification[];
  logs: IncidentLog[];
  callers: EmergencyCaller[];
}> = {
  hyderabad: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 17.3616, lng: 78.4747, street: '12 Abids Road, Koti', city: 'Hyderabad', pincode: '500001' },
        reportedAt: '2 min ago', timestamp: '2026-03-22 14:32:04', status: 'active',
        description: 'Structure fire in commercial complex near Koti Women\'s College. Heavy smoke on upper floors.',
        falseAlarmScore: 6, spreadPrediction: 'rapid', affectedArea: '~3,200 sq ft', buildingType: 'Commercial - 6 floors',
        detectionSource: 'camera', humansDetected: 18, aiRecommendation: 'Immediate evacuation. Deploy 4+ units. Aerial ladder for 5th floor access. Notify GHMC.',
      },
      {
        id: 'INC-002', type: 'fire', severity: 'medium',
        location: { lat: 17.4400, lng: 78.3489, street: '45 KPHB Colony, Phase 6', city: 'Hyderabad', pincode: '500072' },
        reportedAt: '10 min ago', timestamp: '2026-03-22 14:24:22', status: 'dispatched',
        description: 'Kitchen fire in residential apartment. Gas leak suspected.',
        falseAlarmScore: 18, spreadPrediction: 'contained', affectedArea: '~500 sq ft', buildingType: 'Residential - 4 floors',
        detectionSource: 'phone', humansDetected: 5, aiRecommendation: 'Shut off gas supply. Ventilate area. Single engine sufficient. Verify gas line integrity.',
      },
      {
        id: 'INC-003', type: 'fire', severity: 'high',
        location: { lat: 17.3950, lng: 78.4400, street: '88 Sultan Bazaar', city: 'Hyderabad', pincode: '500095' },
        reportedAt: '18 min ago', timestamp: '2026-03-22 14:16:10', status: 'dispatched',
        description: 'Electrical fire in wholesale fabric market. Highly combustible materials.',
        falseAlarmScore: 4, spreadPrediction: 'moderate', affectedArea: '~6,000 sq ft', buildingType: 'Market Complex - 3 floors',
        detectionSource: 'camera', humansDetected: 2, aiRecommendation: 'Fabric/textile fire — deploy foam units. Evacuate adjacent shops. Hazmat standby.',
      },
      {
        id: 'INC-004', type: 'fire', severity: 'low',
        location: { lat: 17.4239, lng: 78.5480, street: '7 Uppal Ring Road', city: 'Hyderabad', pincode: '500039' },
        reportedAt: '30 min ago', timestamp: '2026-03-22 14:04:33', status: 'active',
        description: 'Small trash fire near IT park. No structures threatened.',
        falseAlarmScore: 72, spreadPrediction: 'contained', affectedArea: '~50 sq ft', buildingType: 'Open Area',
        detectionSource: 'sensor', humansDetected: 0, aiRecommendation: 'High false alarm probability. Minor trash fire. Monitor remotely. No dispatch needed.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE HYD-7', status: 'en_route', location: { lat: 17.3700, lng: 78.4800 }, eta: '4 min', assignedIncident: 'INC-001', speed: 42 },
      { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE HYD-12', status: 'on_scene', location: { lat: 17.4400, lng: 78.3489 }, assignedIncident: 'INC-002', speed: 0 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC HYD-3', status: 'en_route', location: { lat: 17.3650, lng: 78.4700 }, eta: '6 min', assignedIncident: 'INC-001', speed: 48 },
      { id: 'POL-01', type: 'police', callsign: 'PATROL HYD-9', status: 'en_route', location: { lat: 17.3580, lng: 78.4850 }, eta: '3 min', assignedIncident: 'INC-001', speed: 55 },
      { id: 'FE-03', type: 'fire_engine', callsign: 'ENGINE HYD-4', status: 'available', location: { lat: 17.4100, lng: 78.4500 }, speed: 0 },
      { id: 'AMB-02', type: 'ambulance', callsign: 'MEDIC HYD-8', status: 'en_route', location: { lat: 17.3900, lng: 78.4350 }, eta: '8 min', assignedIncident: 'INC-003', speed: 35 },
      { id: 'POL-02', type: 'police', callsign: 'PATROL HYD-14', status: 'available', location: { lat: 17.4300, lng: 78.3600 }, speed: 0 },
    ],
    stations: [
      { id: 'FS-01', name: 'Abids Fire Station', location: { lat: 17.3940, lng: 78.4760 }, address: 'Abids Road, Hyderabad 500001', phone: '+91-40-2320-1101', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Secunderabad Fire Station', location: { lat: 17.4399, lng: 78.4983 }, address: 'SD Road, Secunderabad 500003', phone: '+91-40-2770-3201', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-03', name: 'Nampally Fire Station', location: { lat: 17.3888, lng: 78.4630 }, address: 'Nampally, Hyderabad 500001', phone: '+91-40-2346-1501', engines: 3, ambulances: 1, status: 'busy' },
      { id: 'FS-04', name: 'Kukatpally Fire Station', location: { lat: 17.4849, lng: 78.3905 }, address: 'KPHB Main Road, Kukatpally 500072', phone: '+91-40-2305-8901', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-05', name: 'LB Nagar Fire Station', location: { lat: 17.3457, lng: 78.5522 }, address: 'LB Nagar Ring Road, Hyderabad 500074', phone: '+91-40-2404-2201', engines: 2, ambulances: 1, status: 'operational' },
      { id: 'FS-06', name: 'Madhapur Fire Station', location: { lat: 17.4435, lng: 78.3772 }, address: 'Hitech City, Madhapur 500081', phone: '+91-40-2311-5501', engines: 3, ambulances: 2, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Structure fire at 12 Abids Road, Koti — immediate response', time: '2 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE HYD-7, MEDIC HYD-3, PATROL HYD-9 dispatched to INC-001', time: '2 min ago', read: false },
      { id: 'N3', type: 'update', message: 'INC-002: Kitchen fire contained. Gas supply shut off.', time: '7 min ago', read: true },
      { id: 'N4', type: 'dispatch', message: 'ENGINE HYD-12 arrived on scene at INC-002', time: '8 min ago', read: true },
      { id: 'N5', type: 'alert', message: 'HIGH: Fabric market fire at Sultan Bazaar — combustible materials', time: '18 min ago', read: true },
      { id: 'N6', type: 'update', message: 'INC-004: False alarm probability 72% — monitoring', time: '25 min ago', read: true },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:04', event: 'Fire detected by Camera 3 at Koti', severity: 'critical', location: '12 Abids Road, Koti', status: 'detected', details: 'Smoke and flames on 5th floor. AI confidence: 97%.' },
      { id: 'LOG-002', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:09', event: 'Alert sent to Abids Fire Station', severity: 'critical', location: '12 Abids Road, Koti', status: 'alerted', details: 'Auto-alert via SMS, radio. GHMC notified.' },
      { id: 'LOG-003', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:16', event: 'ENGINE HYD-7, MEDIC HYD-3, PATROL HYD-9 dispatched', severity: 'critical', location: '12 Abids Road, Koti', status: 'dispatched', responseTime: '12 sec', details: '3 units en route. ETA 3-6 minutes.' },
      { id: 'LOG-004', incidentId: 'INC-002', timestamp: '2026-03-22 14:24:22', event: 'Fire reported via phone call', severity: 'medium', location: '45 KPHB Colony', status: 'detected', details: 'Caller reported kitchen fire with gas smell.' },
      { id: 'LOG-005', incidentId: 'INC-002', timestamp: '2026-03-22 14:24:30', event: 'ENGINE HYD-12 dispatched', severity: 'medium', location: '45 KPHB Colony', status: 'dispatched', responseTime: '8 sec', details: 'Single engine. Low spread risk.' },
      { id: 'LOG-006', incidentId: 'INC-003', timestamp: '2026-03-22 14:16:10', event: 'Fire detected at Sultan Bazaar', severity: 'high', location: '88 Sultan Bazaar', status: 'detected', details: 'Electrical fire in fabric market. Combustible materials.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Rajesh Kumar', phone: '+91-9876543210', location: { lat: 17.3620, lng: 78.4750 }, address: '12 Abids Road, Koti, Hyderabad', callTime: '14:32:01', duration: '2m 34s', status: 'active', severity: 'critical', description: 'Heavy smoke from 5th floor of commercial building. People trapped.', locationType: 'gps', accuracy: '±3m' },
      { id: 'CALL-002', name: 'Priya Sharma', phone: '+91-9123456789', location: { lat: 17.4405, lng: 78.3492 }, address: '45 KPHB Colony Phase 6, Hyderabad', callTime: '14:24:18', duration: '1m 12s', status: 'completed', severity: 'medium', description: 'Kitchen fire, gas smell. Family evacuated safely.', locationType: 'gps', accuracy: '±5m' },
      { id: 'CALL-003', name: 'Mohammed Irfan', phone: '+91-9988776655', location: { lat: 17.3955, lng: 78.4405 }, address: 'Near Sultan Bazaar crossing, Hyderabad', callTime: '14:15:55', duration: '3m 08s', status: 'completed', severity: 'high', description: 'Electrical sparks in fabric godown. Fire spreading to adjacent shop.', locationType: 'tower', accuracy: '±25m' },
      { id: 'CALL-004', name: 'Lakshmi Devi', phone: '+91-9876501234', location: { lat: 17.3850, lng: 78.4600 }, address: 'Nampally Station Road, Hyderabad', callTime: '14:10:30', duration: '0m 45s', status: 'missed', severity: 'low', description: 'Disconnected call. Location traced near railway station.', locationType: 'tower', accuracy: '±50m' },
      { id: 'CALL-005', name: 'Srinivas Reddy', phone: '+91-9001234567', location: { lat: 17.4250, lng: 78.5490 }, address: '7 Uppal Ring Road, near Infosys campus', callTime: '14:04:20', duration: '1m 55s', status: 'completed', severity: 'low', description: 'Small trash fire near IT park boundary wall.', locationType: 'gps', accuracy: '±8m' },
    ],
  },
  delhi: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 28.6139, lng: 77.2090, street: '42 Connaught Place', city: 'New Delhi', pincode: '110001' },
        reportedAt: '2 min ago', timestamp: '2026-03-22 14:32:04', status: 'active',
        description: 'Structure fire on 3rd floor of commercial building. Heavy smoke visible.',
        falseAlarmScore: 8, spreadPrediction: 'rapid', affectedArea: '~2,400 sq ft', buildingType: 'Commercial - 5 floors',
        detectionSource: 'camera', humansDetected: 12, aiRecommendation: 'Immediate evacuation. Deploy 3+ units. Aerial ladder for 3rd floor.',
      },
      {
        id: 'INC-002', type: 'fire', severity: 'medium',
        location: { lat: 28.6304, lng: 77.2177, street: '15 Kashmere Gate', city: 'New Delhi', pincode: '110006' },
        reportedAt: '8 min ago', timestamp: '2026-03-22 14:26:22', status: 'dispatched',
        description: 'Kitchen fire in residential apartment.',
        falseAlarmScore: 22, spreadPrediction: 'contained', affectedArea: '~400 sq ft', buildingType: 'Residential - 3 floors',
        detectionSource: 'sensor', humansDetected: 3, aiRecommendation: 'Fire containable. Single engine sufficient.',
      },
      {
        id: 'INC-003', type: 'fire', severity: 'high',
        location: { lat: 28.5672, lng: 77.2100, street: '88 Sarojini Nagar Market', city: 'New Delhi', pincode: '110023' },
        reportedAt: '15 min ago', timestamp: '2026-03-22 14:19:10', status: 'dispatched',
        description: 'Fire in warehouse storage area with combustible materials.',
        falseAlarmScore: 5, spreadPrediction: 'moderate', affectedArea: '~5,000 sq ft', buildingType: 'Warehouse',
        detectionSource: 'camera', humansDetected: 0, aiRecommendation: 'No humans detected. Focus on containment. Hazmat advised.',
      },
      {
        id: 'INC-004', type: 'fire', severity: 'low',
        location: { lat: 28.6448, lng: 77.1695, street: '3 Patel Nagar West', city: 'New Delhi', pincode: '110008' },
        reportedAt: '25 min ago', timestamp: '2026-03-22 14:09:33', status: 'active',
        description: 'Small electrical fire in utility room.',
        falseAlarmScore: 65, spreadPrediction: 'contained', affectedArea: '~100 sq ft', buildingType: 'Office - 8 floors',
        detectionSource: 'sensor', humansDetected: 0, aiRecommendation: 'High false alarm probability. Verify on-site.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE DEL-7', status: 'en_route', location: { lat: 28.6200, lng: 77.2050 }, eta: '3 min', assignedIncident: 'INC-001', speed: 45 },
      { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE DEL-12', status: 'on_scene', location: { lat: 28.6304, lng: 77.2177 }, assignedIncident: 'INC-002', speed: 0 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC DEL-3', status: 'en_route', location: { lat: 28.6180, lng: 77.2120 }, eta: '5 min', assignedIncident: 'INC-001', speed: 52 },
      { id: 'POL-01', type: 'police', callsign: 'PATROL DEL-9', status: 'en_route', location: { lat: 28.6100, lng: 77.2150 }, eta: '2 min', assignedIncident: 'INC-001', speed: 60 },
      { id: 'FE-03', type: 'fire_engine', callsign: 'ENGINE DEL-4', status: 'available', location: { lat: 28.5800, lng: 77.2300 }, speed: 0 },
      { id: 'AMB-02', type: 'ambulance', callsign: 'MEDIC DEL-8', status: 'en_route', location: { lat: 28.5700, lng: 77.2050 }, eta: '7 min', assignedIncident: 'INC-003', speed: 38 },
      { id: 'POL-02', type: 'police', callsign: 'PATROL DEL-14', status: 'available', location: { lat: 28.6500, lng: 77.1800 }, speed: 0 },
    ],
    stations: [
      { id: 'FS-01', name: 'Central Delhi Fire Station', location: { lat: 28.6280, lng: 77.2190 }, address: 'Connaught Place, New Delhi 110001', phone: '+91-11-2336-1301', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Kashmere Gate Fire Station', location: { lat: 28.6670, lng: 77.2280 }, address: 'Kashmere Gate, New Delhi 110006', phone: '+91-11-2386-5101', engines: 3, ambulances: 1, status: 'operational' },
      { id: 'FS-03', name: 'Sarojini Nagar Fire Station', location: { lat: 28.5740, lng: 77.2020 }, address: 'Sarojini Nagar, New Delhi 110023', phone: '+91-11-2411-2301', engines: 3, ambulances: 2, status: 'busy' },
      { id: 'FS-04', name: 'Patel Nagar Fire Station', location: { lat: 28.6510, lng: 77.1630 }, address: 'Patel Nagar, New Delhi 110008', phone: '+91-11-2578-4201', engines: 2, ambulances: 1, status: 'operational' },
      { id: 'FS-05', name: 'Janakpuri Fire Station', location: { lat: 28.6200, lng: 77.0900 }, address: 'Janakpuri, New Delhi 110058', phone: '+91-11-2553-1101', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-06', name: 'Lajpat Nagar Fire Station', location: { lat: 28.5700, lng: 77.2400 }, address: 'Lajpat Nagar, New Delhi 110024', phone: '+91-11-2634-2101', engines: 2, ambulances: 1, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Structure fire at 42 Connaught Place — immediate response', time: '2 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE DEL-7, MEDIC DEL-3, PATROL DEL-9 dispatched to INC-001', time: '2 min ago', read: false },
      { id: 'N3', type: 'update', message: 'INC-002: Fire contained to single apartment', time: '5 min ago', read: true },
      { id: 'N4', type: 'dispatch', message: 'ENGINE DEL-12 arrived on scene at INC-002', time: '6 min ago', read: true },
      { id: 'N5', type: 'alert', message: 'HIGH: Warehouse fire at Sarojini Nagar', time: '15 min ago', read: true },
      { id: 'N6', type: 'update', message: 'INC-004: False alarm 65% — verifying', time: '20 min ago', read: true },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:04', event: 'Fire detected at Connaught Place', severity: 'critical', location: '42 Connaught Place', status: 'detected', details: 'Smoke and flames on 3rd floor. AI confidence: 96%.' },
      { id: 'LOG-002', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:08', event: 'Alert sent to Central Delhi Station', severity: 'critical', location: '42 Connaught Place', status: 'alerted', details: 'Auto-alert via SMS and radio.' },
      { id: 'LOG-003', incidentId: 'INC-001', timestamp: '2026-03-22 14:32:15', event: 'ENGINE DEL-7, MEDIC DEL-3, PATROL DEL-9 dispatched', severity: 'critical', location: '42 Connaught Place', status: 'dispatched', responseTime: '11 sec', details: '3 units dispatched. ETA 3-5 min.' },
      { id: 'LOG-004', incidentId: 'INC-002', timestamp: '2026-03-22 14:26:22', event: 'Fire detected by Sensor Array B', severity: 'medium', location: '15 Kashmere Gate', status: 'detected', details: 'Heat sensor triggered. Kitchen fire confirmed.' },
      { id: 'LOG-005', incidentId: 'INC-002', timestamp: '2026-03-22 14:26:30', event: 'ENGINE DEL-12 dispatched', severity: 'medium', location: '15 Kashmere Gate', status: 'dispatched', responseTime: '8 sec', details: 'Single engine.' },
      { id: 'LOG-006', incidentId: 'INC-003', timestamp: '2026-03-22 14:19:10', event: 'Fire detected at Sarojini Nagar', severity: 'high', location: '88 Sarojini Nagar Market', status: 'detected', details: 'Large fire. Combustible materials.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Amit Verma', phone: '+91-9811234567', location: { lat: 28.6142, lng: 77.2095 }, address: '42 Connaught Place, New Delhi', callTime: '14:31:55', duration: '2m 10s', status: 'active', severity: 'critical', description: 'Smoke pouring from 3rd floor windows. People screaming.', locationType: 'gps', accuracy: '±4m' },
      { id: 'CALL-002', name: 'Sunita Devi', phone: '+91-9899887766', location: { lat: 28.6310, lng: 77.2180 }, address: '15 Kashmere Gate, New Delhi', callTime: '14:26:10', duration: '1m 30s', status: 'completed', severity: 'medium', description: 'Kitchen caught fire. Family is outside.', locationType: 'gps', accuracy: '±6m' },
      { id: 'CALL-003', name: 'Vikram Singh', phone: '+91-9650012345', location: { lat: 28.5675, lng: 77.2105 }, address: 'Sarojini Nagar Market, New Delhi', callTime: '14:18:42', duration: '2m 45s', status: 'completed', severity: 'high', description: 'Warehouse on fire. Chemicals stored inside.', locationType: 'tower', accuracy: '±20m' },
    ],
  },
  mumbai: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 18.9440, lng: 72.8234, street: '78 Colaba Causeway', city: 'Mumbai', pincode: '400005' },
        reportedAt: '3 min ago', timestamp: '2026-03-22 14:31:04', status: 'active',
        description: 'Fire in old heritage building near Taj Hotel. Dense smoke.',
        falseAlarmScore: 5, spreadPrediction: 'rapid', affectedArea: '~4,000 sq ft', buildingType: 'Heritage - 4 floors',
        detectionSource: 'camera', humansDetected: 22, aiRecommendation: 'Heritage structure — avoid water damage where possible. Deploy 4+ units.',
      },
      {
        id: 'INC-002', type: 'fire', severity: 'high',
        location: { lat: 19.0176, lng: 72.8562, street: '12 Dadar West, Shivaji Park', city: 'Mumbai', pincode: '400028' },
        reportedAt: '12 min ago', timestamp: '2026-03-22 14:22:22', status: 'dispatched',
        description: 'Fire in residential chawl. Multiple families affected.',
        falseAlarmScore: 10, spreadPrediction: 'moderate', affectedArea: '~2,000 sq ft', buildingType: 'Chawl - 3 floors',
        detectionSource: 'phone', humansDetected: 35, aiRecommendation: 'High occupancy. Prioritize evacuation. Deploy ladder units.',
      },
      {
        id: 'INC-003', type: 'fire', severity: 'medium',
        location: { lat: 19.1136, lng: 72.8697, street: '45 Andheri East, MIDC', city: 'Mumbai', pincode: '400093' },
        reportedAt: '20 min ago', timestamp: '2026-03-22 14:14:10', status: 'dispatched',
        description: 'Factory fire in industrial zone.',
        falseAlarmScore: 12, spreadPrediction: 'slow', affectedArea: '~3,000 sq ft', buildingType: 'Industrial',
        detectionSource: 'sensor', humansDetected: 0, aiRecommendation: 'No workers present (night shift). Chemical inventory check needed.',
      },
      {
        id: 'INC-004', type: 'fire', severity: 'low',
        location: { lat: 19.0760, lng: 72.8777, street: '3 Bandra Linking Road', city: 'Mumbai', pincode: '400050' },
        reportedAt: '35 min ago', timestamp: '2026-03-22 13:59:33', status: 'active',
        description: 'Electrical short circuit in shop. Sparking reported.',
        falseAlarmScore: 70, spreadPrediction: 'contained', affectedArea: '~80 sq ft', buildingType: 'Retail Shop',
        detectionSource: 'manual', humansDetected: 0, aiRecommendation: 'Isolate electrical supply. Monitor only.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE MUM-3', status: 'en_route', location: { lat: 18.9500, lng: 72.8300 }, eta: '5 min', assignedIncident: 'INC-001', speed: 35 },
      { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE MUM-8', status: 'on_scene', location: { lat: 19.0176, lng: 72.8562 }, assignedIncident: 'INC-002', speed: 0 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC MUM-1', status: 'en_route', location: { lat: 18.9480, lng: 72.8250 }, eta: '7 min', assignedIncident: 'INC-001', speed: 40 },
      { id: 'POL-01', type: 'police', callsign: 'PATROL MUM-5', status: 'en_route', location: { lat: 18.9550, lng: 72.8350 }, eta: '4 min', assignedIncident: 'INC-001', speed: 50 },
      { id: 'FE-03', type: 'fire_engine', callsign: 'ENGINE MUM-11', status: 'available', location: { lat: 19.0900, lng: 72.8600 }, speed: 0 },
      { id: 'AMB-02', type: 'ambulance', callsign: 'MEDIC MUM-6', status: 'en_route', location: { lat: 19.1100, lng: 72.8650 }, eta: '6 min', assignedIncident: 'INC-003', speed: 42 },
      { id: 'POL-02', type: 'police', callsign: 'PATROL MUM-12', status: 'available', location: { lat: 19.0600, lng: 72.8700 }, speed: 0 },
    ],
    stations: [
      { id: 'FS-01', name: 'Colaba Fire Station', location: { lat: 18.9067, lng: 72.8147 }, address: 'Colaba, Mumbai 400005', phone: '+91-22-2215-1101', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Byculla Fire Station', location: { lat: 18.9785, lng: 72.8330 }, address: 'Byculla, Mumbai 400027', phone: '+91-22-2307-2201', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-03', name: 'Dadar Fire Station', location: { lat: 19.0190, lng: 72.8440 }, address: 'Dadar West, Mumbai 400028', phone: '+91-22-2422-3301', engines: 3, ambulances: 1, status: 'busy' },
      { id: 'FS-04', name: 'Andheri Fire Station', location: { lat: 19.1197, lng: 72.8465 }, address: 'Andheri East, Mumbai 400093', phone: '+91-22-2683-4401', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-05', name: 'Bandra Fire Station', location: { lat: 19.0596, lng: 72.8295 }, address: 'Bandra West, Mumbai 400050', phone: '+91-22-2640-5501', engines: 2, ambulances: 1, status: 'operational' },
      { id: 'FS-06', name: 'Borivali Fire Station', location: { lat: 19.2288, lng: 72.8544 }, address: 'Borivali West, Mumbai 400092', phone: '+91-22-2898-6601', engines: 3, ambulances: 2, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Heritage building fire at Colaba Causeway — immediate response', time: '3 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE MUM-3, MEDIC MUM-1, PATROL MUM-5 dispatched to INC-001', time: '3 min ago', read: false },
      { id: 'N3', type: 'update', message: 'INC-002: Chawl fire. 35 people being evacuated.', time: '10 min ago', read: true },
      { id: 'N4', type: 'alert', message: 'HIGH: Factory fire at Andheri MIDC — no workers present', time: '20 min ago', read: true },
      { id: 'N5', type: 'update', message: 'INC-004: Electrical issue at Bandra — false alarm likely', time: '30 min ago', read: true },
      { id: 'N6', type: 'dispatch', message: 'ENGINE MUM-8 arrived at Dadar chawl fire', time: '10 min ago', read: true },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:31:04', event: 'Fire detected at Colaba', severity: 'critical', location: '78 Colaba Causeway', status: 'detected', details: 'Heritage building. Heavy smoke. AI confidence: 98%.' },
      { id: 'LOG-002', incidentId: 'INC-001', timestamp: '2026-03-22 14:31:10', event: 'Alert sent to Colaba Station', severity: 'critical', location: '78 Colaba Causeway', status: 'alerted', details: 'Auto-alert dispatched. BMC notified.' },
      { id: 'LOG-003', incidentId: 'INC-002', timestamp: '2026-03-22 14:22:22', event: 'Phone call — fire in chawl', severity: 'high', location: '12 Dadar West', status: 'detected', details: 'Multiple families affected.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Ravi Patel', phone: '+91-9820012345', location: { lat: 18.9445, lng: 72.8240 }, address: '78 Colaba Causeway, Mumbai', callTime: '14:30:50', duration: '3m 15s', status: 'active', severity: 'critical', description: 'Old building on fire near Taj Hotel. Smoke everywhere.', locationType: 'gps', accuracy: '±3m' },
      { id: 'CALL-002', name: 'Meena Jadhav', phone: '+91-9867654321', location: { lat: 19.0180, lng: 72.8565 }, address: 'Dadar West Chawl, Mumbai', callTime: '14:22:10', duration: '2m 40s', status: 'completed', severity: 'high', description: 'Fire spreading in chawl. Many families inside.', locationType: 'gps', accuracy: '±5m' },
    ],
  },
  bangalore: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 12.9716, lng: 77.5946, street: '22 MG Road, Brigade Gateway', city: 'Bengaluru', pincode: '560001' },
        reportedAt: '4 min ago', timestamp: '2026-03-22 14:30:04', status: 'active',
        description: 'Fire in tech park server room. Electrical fire with dense smoke.',
        falseAlarmScore: 7, spreadPrediction: 'moderate', affectedArea: '~1,800 sq ft', buildingType: 'Tech Park - 12 floors',
        detectionSource: 'sensor', humansDetected: 45, aiRecommendation: 'Electrical fire — use CO2 extinguishers. Cut power. Evacuate immediately.',
      },
      {
        id: 'INC-002', type: 'fire', severity: 'medium',
        location: { lat: 12.9352, lng: 77.6245, street: '8 Koramangala 5th Block', city: 'Bengaluru', pincode: '560095' },
        reportedAt: '15 min ago', timestamp: '2026-03-22 14:19:22', status: 'dispatched',
        description: 'Restaurant kitchen fire. LPG cylinder involved.',
        falseAlarmScore: 15, spreadPrediction: 'contained', affectedArea: '~600 sq ft', buildingType: 'Commercial - 2 floors',
        detectionSource: 'phone', humansDetected: 8, aiRecommendation: 'LPG involved — maintain distance. Cool cylinder if safe. Evacuate 50m radius.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE BLR-5', status: 'en_route', location: { lat: 12.9750, lng: 77.5900 }, eta: '4 min', assignedIncident: 'INC-001', speed: 40 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC BLR-2', status: 'en_route', location: { lat: 12.9680, lng: 77.5980 }, eta: '6 min', assignedIncident: 'INC-001', speed: 45 },
      { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE BLR-9', status: 'on_scene', location: { lat: 12.9352, lng: 77.6245 }, assignedIncident: 'INC-002', speed: 0 },
      { id: 'POL-01', type: 'police', callsign: 'PATROL BLR-7', status: 'available', location: { lat: 12.9800, lng: 77.5700 }, speed: 0 },
    ],
    stations: [
      { id: 'FS-01', name: 'MG Road Fire Station', location: { lat: 12.9756, lng: 77.6066 }, address: 'MG Road, Bengaluru 560001', phone: '+91-80-2558-1101', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Koramangala Fire Station', location: { lat: 12.9279, lng: 77.6271 }, address: 'Koramangala, Bengaluru 560095', phone: '+91-80-2553-2201', engines: 3, ambulances: 1, status: 'busy' },
      { id: 'FS-03', name: 'Whitefield Fire Station', location: { lat: 12.9698, lng: 77.7500 }, address: 'Whitefield, Bengaluru 560066', phone: '+91-80-2845-3301', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-04', name: 'Jayanagar Fire Station', location: { lat: 12.9250, lng: 77.5838 }, address: 'Jayanagar, Bengaluru 560011', phone: '+91-80-2663-4401', engines: 2, ambulances: 1, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Server room fire at MG Road tech park', time: '4 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE BLR-5, MEDIC BLR-2 dispatched to INC-001', time: '4 min ago', read: false },
      { id: 'N3', type: 'update', message: 'INC-002: Restaurant fire contained. LPG secured.', time: '12 min ago', read: true },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:30:04', event: 'Fire detected in server room', severity: 'critical', location: '22 MG Road', status: 'detected', details: 'Electrical fire. Smoke detectors triggered. AI confidence: 94%.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Suresh Nair', phone: '+91-9845012345', location: { lat: 12.9720, lng: 77.5950 }, address: '22 MG Road, Brigade Gateway, Bengaluru', callTime: '14:29:45', duration: '2m 30s', status: 'active', severity: 'critical', description: 'Server room smoking heavily. Building security evacuating.', locationType: 'gps', accuracy: '±4m' },
    ],
  },
  chennai: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'high',
        location: { lat: 13.0827, lng: 80.2707, street: '55 Anna Salai, Teynampet', city: 'Chennai', pincode: '600018' },
        reportedAt: '5 min ago', timestamp: '2026-03-22 14:29:04', status: 'active',
        description: 'Fire in multi-story office building. Electrical short circuit suspected.',
        falseAlarmScore: 10, spreadPrediction: 'moderate', affectedArea: '~2,500 sq ft', buildingType: 'Office - 8 floors',
        detectionSource: 'camera', humansDetected: 30, aiRecommendation: 'Evacuate all floors. Deploy 3+ units with ladder.',
      },
      {
        id: 'INC-002', type: 'fire', severity: 'medium',
        location: { lat: 13.0604, lng: 80.2496, street: '12 T Nagar, Ranganathan Street', city: 'Chennai', pincode: '600017' },
        reportedAt: '20 min ago', timestamp: '2026-03-22 14:14:22', status: 'dispatched',
        description: 'Textile shop fire in commercial area.',
        falseAlarmScore: 14, spreadPrediction: 'slow', affectedArea: '~1,200 sq ft', buildingType: 'Commercial',
        detectionSource: 'phone', humansDetected: 0, aiRecommendation: 'Shop closed. Fabric fire — use foam. Prevent spread to adjacent shops.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE CHE-4', status: 'en_route', location: { lat: 13.0850, lng: 80.2650 }, eta: '5 min', assignedIncident: 'INC-001', speed: 38 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC CHE-2', status: 'en_route', location: { lat: 13.0800, lng: 80.2750 }, eta: '7 min', assignedIncident: 'INC-001', speed: 42 },
      { id: 'FE-02', type: 'fire_engine', callsign: 'ENGINE CHE-7', status: 'on_scene', location: { lat: 13.0604, lng: 80.2496 }, assignedIncident: 'INC-002', speed: 0 },
    ],
    stations: [
      { id: 'FS-01', name: 'Teynampet Fire Station', location: { lat: 13.0380, lng: 80.2480 }, address: 'Anna Salai, Chennai 600018', phone: '+91-44-2434-1101', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Mylapore Fire Station', location: { lat: 13.0339, lng: 80.2676 }, address: 'Mylapore, Chennai 600004', phone: '+91-44-2464-2201', engines: 3, ambulances: 1, status: 'operational' },
      { id: 'FS-03', name: 'Adyar Fire Station', location: { lat: 13.0012, lng: 80.2565 }, address: 'Adyar, Chennai 600020', phone: '+91-44-2491-3301', engines: 3, ambulances: 2, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'HIGH: Office fire at Anna Salai — evacuation in progress', time: '5 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE CHE-4, MEDIC CHE-2 dispatched to INC-001', time: '5 min ago', read: false },
      { id: 'N3', type: 'update', message: 'INC-002: Textile shop fire being contained', time: '15 min ago', read: true },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:29:04', event: 'Fire detected at Anna Salai', severity: 'high', location: '55 Anna Salai', status: 'detected', details: 'Office building fire. 30 people inside.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Karthik Sundaram', phone: '+91-9840056789', location: { lat: 13.0830, lng: 80.2710 }, address: '55 Anna Salai, Teynampet, Chennai', callTime: '14:28:30', duration: '3m 05s', status: 'active', severity: 'high', description: 'Fire on 6th floor. Smoke in stairwell. People trying to evacuate.', locationType: 'gps', accuracy: '±5m' },
    ],
  },
  kolkata: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 22.5726, lng: 88.3639, street: '14 Park Street', city: 'Kolkata', pincode: '700016' },
        reportedAt: '3 min ago', timestamp: '2026-03-22 14:31:04', status: 'active',
        description: 'Fire in heritage building restaurant area. Gas leak suspected.',
        falseAlarmScore: 8, spreadPrediction: 'rapid', affectedArea: '~3,500 sq ft', buildingType: 'Heritage Commercial - 3 floors',
        detectionSource: 'camera', humansDetected: 40, aiRecommendation: 'Gas leak — cut supply immediately. Evacuate 100m radius. Heritage structure.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE KOL-2', status: 'en_route', location: { lat: 22.5750, lng: 88.3600 }, eta: '4 min', assignedIncident: 'INC-001', speed: 38 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC KOL-1', status: 'en_route', location: { lat: 22.5700, lng: 88.3680 }, eta: '6 min', assignedIncident: 'INC-001', speed: 42 },
    ],
    stations: [
      { id: 'FS-01', name: 'Park Street Fire Station', location: { lat: 22.5520, lng: 88.3530 }, address: 'Park Street, Kolkata 700016', phone: '+91-33-2229-1101', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Howrah Fire Station', location: { lat: 22.5958, lng: 88.2636 }, address: 'Howrah, Kolkata 711101', phone: '+91-33-2660-2201', engines: 4, ambulances: 2, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Fire at Park Street restaurant — gas leak', time: '3 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE KOL-2, MEDIC KOL-1 dispatched to INC-001', time: '3 min ago', read: false },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:31:04', event: 'Fire detected at Park Street', severity: 'critical', location: '14 Park Street', status: 'detected', details: 'Heritage building. Gas leak. AI confidence: 95%.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Arnab Chatterjee', phone: '+91-9831012345', location: { lat: 22.5728, lng: 88.3642 }, address: '14 Park Street, Kolkata', callTime: '14:30:45', duration: '2m 20s', status: 'active', severity: 'critical', description: 'Restaurant area on fire. Smell of gas. People running out.', locationType: 'gps', accuracy: '±4m' },
    ],
  },
  pune: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'high',
        location: { lat: 18.5204, lng: 73.8567, street: '33 FC Road, Deccan Gymkhana', city: 'Pune', pincode: '411004' },
        reportedAt: '6 min ago', timestamp: '2026-03-22 14:28:04', status: 'active',
        description: 'Fire in coaching institute building. Students evacuating.',
        falseAlarmScore: 9, spreadPrediction: 'moderate', affectedArea: '~2,000 sq ft', buildingType: 'Educational - 4 floors',
        detectionSource: 'phone', humansDetected: 60, aiRecommendation: 'High occupancy — student evacuation priority. Deploy all available units.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE PNE-3', status: 'en_route', location: { lat: 18.5250, lng: 73.8500 }, eta: '5 min', assignedIncident: 'INC-001', speed: 35 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC PNE-1', status: 'en_route', location: { lat: 18.5180, lng: 73.8600 }, eta: '7 min', assignedIncident: 'INC-001', speed: 40 },
    ],
    stations: [
      { id: 'FS-01', name: 'Deccan Fire Station', location: { lat: 18.5165, lng: 73.8412 }, address: 'Deccan Gymkhana, Pune 411004', phone: '+91-20-2567-1101', engines: 3, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Shivajinagar Fire Station', location: { lat: 18.5314, lng: 73.8446 }, address: 'Shivajinagar, Pune 411005', phone: '+91-20-2553-2201', engines: 3, ambulances: 1, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'HIGH: Fire at FC Road coaching institute — 60 students', time: '6 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE PNE-3, MEDIC PNE-1 dispatched to INC-001', time: '6 min ago', read: false },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:28:04', event: 'Fire reported at FC Road', severity: 'high', location: '33 FC Road', status: 'detected', details: 'Coaching institute. 60 students present.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Sneha Kulkarni', phone: '+91-9823012345', location: { lat: 18.5208, lng: 73.8570 }, address: '33 FC Road, Deccan Gymkhana, Pune', callTime: '14:27:30', duration: '2m 50s', status: 'active', severity: 'high', description: 'Institute building on fire. Students evacuating through back exit.', locationType: 'gps', accuracy: '±6m' },
    ],
  },
  ahmedabad: {
    incidents: [
      {
        id: 'INC-001', type: 'fire', severity: 'critical',
        location: { lat: 23.0225, lng: 72.5714, street: '18 CG Road, Navrangpura', city: 'Ahmedabad', pincode: '380009' },
        reportedAt: '4 min ago', timestamp: '2026-03-22 14:30:04', status: 'active',
        description: 'Fire in textile factory. Large quantities of cotton stored.',
        falseAlarmScore: 5, spreadPrediction: 'rapid', affectedArea: '~8,000 sq ft', buildingType: 'Factory - 2 floors',
        detectionSource: 'camera', humansDetected: 15, aiRecommendation: 'Cotton fire — extremely rapid spread. Deploy all units. Water + foam. Evacuate 200m.',
      },
    ],
    vehicles: [
      { id: 'FE-01', type: 'fire_engine', callsign: 'ENGINE AMD-6', status: 'en_route', location: { lat: 23.0250, lng: 72.5680 }, eta: '4 min', assignedIncident: 'INC-001', speed: 42 },
      { id: 'AMB-01', type: 'ambulance', callsign: 'MEDIC AMD-2', status: 'en_route', location: { lat: 23.0200, lng: 72.5750 }, eta: '6 min', assignedIncident: 'INC-001', speed: 45 },
    ],
    stations: [
      { id: 'FS-01', name: 'Navrangpura Fire Station', location: { lat: 23.0350, lng: 72.5600 }, address: 'CG Road, Ahmedabad 380009', phone: '+91-79-2656-1101', engines: 4, ambulances: 2, status: 'operational' },
      { id: 'FS-02', name: 'Maninagar Fire Station', location: { lat: 23.0003, lng: 72.6020 }, address: 'Maninagar, Ahmedabad 380008', phone: '+91-79-2546-2201', engines: 3, ambulances: 2, status: 'operational' },
    ],
    notifications: [
      { id: 'N1', type: 'alert', message: 'CRITICAL: Textile factory fire at CG Road — cotton stored', time: '4 min ago', read: false },
      { id: 'N2', type: 'dispatch', message: 'ENGINE AMD-6, MEDIC AMD-2 dispatched to INC-001', time: '4 min ago', read: false },
    ],
    logs: [
      { id: 'LOG-001', incidentId: 'INC-001', timestamp: '2026-03-22 14:30:04', event: 'Fire detected at textile factory', severity: 'critical', location: '18 CG Road', status: 'detected', details: 'Cotton factory. Rapid spread risk. AI confidence: 97%.' },
    ],
    callers: [
      { id: 'CALL-001', name: 'Hardik Shah', phone: '+91-9825012345', location: { lat: 23.0228, lng: 72.5718 }, address: '18 CG Road, Navrangpura, Ahmedabad', callTime: '14:29:40', duration: '2m 15s', status: 'active', severity: 'critical', description: 'Factory on fire. Cotton bales burning. Workers evacuating.', locationType: 'gps', accuracy: '±5m' },
    ],
  },
};

// ===== CITY STATE MANAGEMENT =====
let currentCity: CityKey = 'hyderabad';

export function setCurrentCity(city: CityKey) {
  currentCity = city;
}

export function getCurrentCity(): CityKey {
  return currentCity;
}

export function getCityConfig(): CityConfig {
  return indianCities.find(c => c.key === currentCity)!;
}

// ===== DYNAMIC ACCESSORS =====
export function getIncidents(): Incident[] { return cityData[currentCity].incidents; }
export function getVehicles(): Vehicle[] { return cityData[currentCity].vehicles; }
export function getStations(): FireStation[] { return cityData[currentCity].stations; }
export function getNotifications(): Notification[] { return cityData[currentCity].notifications; }
export function getLogs(): IncidentLog[] { return cityData[currentCity].logs; }
export function getCallers(): EmergencyCaller[] { return cityData[currentCity].callers; }

// Legacy exports (default to current city)
export const mockIncidents = cityData.hyderabad.incidents;
export const mockVehicles = cityData.hyderabad.vehicles;
export const fireStations = cityData.hyderabad.stations;
export const mockNotifications = cityData.hyderabad.notifications;
export const incidentLogs = cityData.hyderabad.logs;

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
