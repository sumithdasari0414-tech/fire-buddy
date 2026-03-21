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
  status: 'active' | 'dispatched' | 'resolved';
  description: string;
  falseAlarmScore: number; // 0-100, higher = more likely false
  spreadPrediction: 'contained' | 'slow' | 'moderate' | 'rapid';
  affectedArea: string;
  buildingType: string;
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

export const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    type: 'fire',
    severity: 'critical',
    location: { lat: 28.6139, lng: 77.2090, street: '42 Connaught Place', city: 'New Delhi', pincode: '110001' },
    reportedAt: '2 min ago',
    status: 'active',
    description: 'Structure fire reported on 3rd floor of commercial building. Smoke visible from street level.',
    falseAlarmScore: 8,
    spreadPrediction: 'rapid',
    affectedArea: '~2,400 sq ft',
    buildingType: 'Commercial - 5 floors',
  },
  {
    id: 'INC-002',
    type: 'fire',
    severity: 'medium',
    location: { lat: 28.6304, lng: 77.2177, street: '15 Kashmere Gate', city: 'New Delhi', pincode: '110006' },
    reportedAt: '8 min ago',
    status: 'dispatched',
    description: 'Kitchen fire in residential apartment. Single unit affected.',
    falseAlarmScore: 22,
    spreadPrediction: 'contained',
    affectedArea: '~400 sq ft',
    buildingType: 'Residential - 3 floors',
  },
  {
    id: 'INC-003',
    type: 'fire',
    severity: 'high',
    location: { lat: 28.5672, lng: 77.2100, street: '88 Sarojini Nagar Market', city: 'New Delhi', pincode: '110023' },
    reportedAt: '15 min ago',
    status: 'dispatched',
    description: 'Fire in warehouse storage area. Multiple combustible materials present.',
    falseAlarmScore: 5,
    spreadPrediction: 'moderate',
    affectedArea: '~5,000 sq ft',
    buildingType: 'Warehouse - Single story',
  },
  {
    id: 'INC-004',
    type: 'fire',
    severity: 'low',
    location: { lat: 28.6448, lng: 77.1695, street: '3 Patel Nagar West', city: 'New Delhi', pincode: '110008' },
    reportedAt: '25 min ago',
    status: 'active',
    description: 'Small electrical fire in utility room. Occupants evacuated safely.',
    falseAlarmScore: 65,
    spreadPrediction: 'contained',
    affectedArea: '~100 sq ft',
    buildingType: 'Office Building - 8 floors',
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
