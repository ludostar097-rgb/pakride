// ==========================================
// PakRide Shared Constants & Pilot Spatial Data
// ==========================================

export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_USER_ROOM: 'join_user_room',
  JOIN_ZONE_FEED: 'join_zone_feed',
  LEAVE_ZONE_FEED: 'leave_zone_feed',
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  SUBMIT_RIDE_REQUEST: 'submit_ride_request',
  SUBMIT_DRIVER_OFFER: 'submit_driver_offer',
  ACCEPT_DRIVER_OFFER: 'accept_driver_offer',
  UPDATE_RIDE_STATUS: 'update_ride_status',
  CANCEL_RIDE: 'cancel_ride',

  // Server -> Client Broadcasts
  NEW_RIDE_AVAILABLE: 'new_ride_available',
  RIDE_CANCELLED_BROADCAST: 'ride_cancelled_broadcast',
  NEW_OFFER_RECEIVED: 'new_offer_received',
  OFFER_ACCEPTED_NOTIFY: 'offer_accepted_notify',
  OFFER_REJECTED_NOTIFY: 'offer_rejected_notify',
  RIDE_STATUS_CHANGED: 'ride_status_changed',
  DRIVER_POSITION_BROADCAST: 'driver_position_broadcast',
  ERROR_ALERT: 'error_alert',
} as const;

// Conversion helper for Integer Minor Units (Paisa: 1 PKR = 100 Paisa)
export const paisaToPkr = (paisa: number): number => Math.round(paisa / 100);
export const pkrToPaisa = (pkr: number): number => Math.round(pkr * 100);

// Canonical Operating Cities Registry
export const OPERATING_CITIES = [
  {
    id: 'city-karachi',
    name: 'Karachi',
    province: 'Sindh',
    centerLat: 24.8607,
    centerLng: 67.0011,
    defaultZoom: 13,
    isActive: true
  },
  {
    id: 'city-islamabad',
    name: 'Islamabad & Rawalpindi',
    province: 'Federal / Punjab',
    centerLat: 33.6844,
    centerLng: 73.0479,
    defaultZoom: 13,
    isActive: true
  },
  {
    id: 'city-lahore',
    name: 'Lahore',
    province: 'Punjab',
    centerLat: 31.5204,
    centerLng: 74.3587,
    defaultZoom: 13,
    isActive: true
  },
  {
    id: 'city-multan',
    name: 'Multan',
    province: 'South Punjab',
    centerLat: 30.1984,
    centerLng: 71.4687,
    defaultZoom: 13,
    isActive: true
  },
  {
    id: 'city-dgkhan',
    name: 'D.G. Khan',
    province: 'South Punjab',
    centerLat: 30.0489,
    centerLng: 70.6455,
    defaultZoom: 13,
    isActive: true
  }
];

export const getNearestOperatingCity = (lat: number, lng: number) => {
  let closest = OPERATING_CITIES[0];
  let minDistance = Infinity;
  for (const city of OPERATING_CITIES) {
    const dLat = (city.centerLat - lat) * 111;
    const dLng = (city.centerLng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }
  return closest;
};

// Multi-City Pilot Zones: Karachi, Islamabad, Lahore, Multan, and D.G. Khan
export const PILOT_ZONES = [
  {
    id: 'zone-karachi-jauhar',
    cityId: 'city-karachi',
    cityName: 'Karachi',
    zoneName: 'Gulistan-e-Jauhar & Gulshan',
    isActive: true,
    centerLat: 24.918,
    centerLng: 67.135,
    radiusKm: 7.5,
    baseFareCarPaisa: 15000, // PKR 150
    baseFareMotoPaisa: 6000,  // PKR 60
    baseFareRickshawPaisa: 9000, // PKR 90
    perKmCarPaisa: 4000,     // PKR 40 / km
    perKmMotoPaisa: 1800,    // PKR 18 / km
    perKmRickshawPaisa: 2500 // PKR 25 / km
  },
  {
    id: 'zone-islamabad-central',
    cityId: 'city-islamabad',
    cityName: 'Islamabad',
    zoneName: 'Islamabad Central & Blue Area',
    isActive: true,
    centerLat: 33.6844,
    centerLng: 73.0479,
    radiusKm: 8.5,
    baseFareCarPaisa: 18000, // PKR 180
    baseFareMotoPaisa: 7000,  // PKR 70
    baseFareRickshawPaisa: 10000, // PKR 100
    perKmCarPaisa: 4500,     // PKR 45 / km
    perKmMotoPaisa: 2000,    // PKR 20 / km
    perKmRickshawPaisa: 2800 // PKR 28 / km
  },
  {
    id: 'zone-lahore-central',
    cityId: 'city-lahore',
    cityName: 'Lahore',
    zoneName: 'Gulberg, Cantt & DHA',
    isActive: true,
    centerLat: 31.5204,
    centerLng: 74.3587,
    radiusKm: 10.0,
    baseFareCarPaisa: 16000, // PKR 160
    baseFareMotoPaisa: 6000,  // PKR 60
    baseFareRickshawPaisa: 9000, // PKR 90
    perKmCarPaisa: 4200,     // PKR 42 / km
    perKmMotoPaisa: 1900,    // PKR 19 / km
    perKmRickshawPaisa: 2600 // PKR 26 / km
  },
  {
    id: 'zone-multan-central',
    cityId: 'city-multan',
    cityName: 'Multan',
    zoneName: 'Cantt, Bosan Road & BZU',
    isActive: true,
    centerLat: 30.1984,
    centerLng: 71.4687,
    radiusKm: 9.0,
    baseFareCarPaisa: 14000, // PKR 140
    baseFareMotoPaisa: 5000,  // PKR 50
    baseFareRickshawPaisa: 8000, // PKR 80
    perKmCarPaisa: 3500,     // PKR 35 / km
    perKmMotoPaisa: 1600,    // PKR 16 / km
    perKmRickshawPaisa: 2200 // PKR 22 / km
  },
  {
    id: 'zone-dgkhan-central',
    cityId: 'city-dgkhan',
    cityName: 'D.G. Khan',
    zoneName: 'Traffic Chowk, Pull Dat & University',
    isActive: true,
    centerLat: 30.0489,
    centerLng: 70.6455,
    radiusKm: 7.5,
    baseFareCarPaisa: 12000, // PKR 120
    baseFareMotoPaisa: 4000,  // PKR 40
    baseFareRickshawPaisa: 7000, // PKR 70
    perKmCarPaisa: 3000,     // PKR 30 / km
    perKmMotoPaisa: 1400,    // PKR 14 / km
    perKmRickshawPaisa: 2000 // PKR 20 / km
  }
];

export const ISLAMABAD_LANDMARKS = [
  { name: 'Saddar Rawalpindi (Bank Road / Cantt)', lat: 33.5930, lng: 73.0545, zone: 'Rawalpindi Saddar' },
  { name: 'Faisal Mosque Main Gate', lat: 33.7296, lng: 73.0372, zone: 'Margalla Foothills' },
  { name: 'Centaurus Mall, Jinnah Ave', lat: 33.7077, lng: 73.0501, zone: 'Islamabad F-8' },
  { name: 'Blue Area (Saudi Pak Tower)', lat: 33.7145, lng: 73.0673, zone: 'Blue Area' },
  { name: 'F-6 Super Market', lat: 33.7297, lng: 73.0784, zone: 'Islamabad F-6' },
  { name: 'F-10 Markaz', lat: 33.6925, lng: 73.0118, zone: 'Islamabad F-10' },
  { name: 'G-9 Karachi Company', lat: 33.6894, lng: 73.0305, zone: 'Islamabad G-9' },
  { name: 'I-8 Markaz', lat: 33.6685, lng: 73.0760, zone: 'Islamabad I-8' },
  { name: 'Islamabad International Airport (IIAP)', lat: 33.5605, lng: 72.8517, zone: 'Islamabad West' }
];

export const KARACHI_LANDMARKS = [
  { name: 'Saddar (Empress Market)', lat: 24.8615, lng: 67.0311, zone: 'Karachi South' },
  { name: 'Jauhar Chowrangi', lat: 24.9213, lng: 67.1355, zone: 'Gulistan-e-Jauhar' },
  { name: 'Kamran Chowrangi', lat: 24.9126, lng: 67.1287, zone: 'Gulistan-e-Jauhar' },
  { name: 'Continental Bakery, Block 12', lat: 24.9248, lng: 67.1382, zone: 'Gulistan-e-Jauhar' },
  { name: 'Darul Sehat Hospital', lat: 24.9142, lng: 67.1396, zone: 'Gulistan-e-Jauhar' },
  { name: 'Millennium Mall / Rashid Minhas Rd', lat: 24.8988, lng: 67.1121, zone: 'Gulistan-e-Jauhar' },
  { name: 'Habib University, Block 18', lat: 24.9037, lng: 67.1389, zone: 'Gulistan-e-Jauhar' },
  { name: 'Jinnah International Airport (JAP)', lat: 24.9065, lng: 67.1608, zone: 'Karachi East' },
  { name: 'Karachi University (KU Silver Jubilee Gate)', lat: 24.9395, lng: 67.1172, zone: 'Gulshan/Jauhar' },
  { name: 'NED University Main Gate', lat: 24.9338, lng: 67.1125, zone: 'Gulshan/Jauhar' },
  { name: 'Safari Park Karachi', lat: 24.9221, lng: 67.1084, zone: 'Gulshan-e-Iqbal' },
  { name: 'Clifton (Teen Talwar)', lat: 24.8293, lng: 67.0336, zone: 'Clifton' }
];

export const LAHORE_LANDMARKS = [
  { name: 'Liberty Market, Gulberg III', lat: 31.5126, lng: 74.3436, zone: 'Gulberg' },
  { name: 'MM Alam Road, Gulberg', lat: 31.5085, lng: 74.3541, zone: 'MM Alam' },
  { name: 'DHA Phase 5 Commercial', lat: 31.4707, lng: 74.4108, zone: 'DHA' },
  { name: 'Mall of Lahore, Cantt', lat: 31.5204, lng: 74.3587, zone: 'Cantt' },
  { name: 'Badshahi Mosque, Old City', lat: 31.5882, lng: 74.3105, zone: 'Walled City' },
  { name: 'Allama Iqbal International Airport (LHE)', lat: 31.5216, lng: 74.4036, zone: 'Airport' }
];

export const MULTAN_LANDMARKS = [
  { name: 'Ghanta Ghar Chowk, Old Multan', lat: 30.1984, lng: 71.4687, zone: 'Old City' },
  { name: 'Multan Cantt (Mall Road / Sadar Bazar)', lat: 30.1815, lng: 71.4428, zone: 'Multan Cantt' },
  { name: 'Bahauddin Zakariya University (BZU Main Gate)', lat: 30.2642, lng: 71.4984, zone: 'Bosan Road' },
  { name: 'Gulgasht Colony Commercial Center', lat: 30.2241, lng: 71.4883, zone: 'Gulgasht' },
  { name: 'Nishtar Hospital Main Gate', lat: 30.1878, lng: 71.4497, zone: 'Nishtar Road' },
  { name: 'Shah Rukn-e-Alam Shrine, Fort Kohna', lat: 30.1993, lng: 71.4722, zone: 'Qasim Fort' },
  { name: 'Multan International Airport (MUX)', lat: 30.2032, lng: 71.4278, zone: 'Airport' }
];

export const DGKHAN_LANDMARKS = [
  { name: 'Traffic Chowk, DG Khan City', lat: 30.0561, lng: 70.6402, zone: 'City Center' },
  { name: 'Pull Dat (Canal Bridge Market)', lat: 30.0489, lng: 70.6455, zone: 'Canal Road' },
  { name: 'Ghazi University (Airport Road Campus)', lat: 30.0270, lng: 70.6280, zone: 'Airport Road' },
  { name: 'DHQ Teaching Hospital DG Khan', lat: 30.0610, lng: 70.6425, zone: 'Hospital Road' },
  { name: 'Model Town Commercial Area', lat: 30.0410, lng: 70.6380, zone: 'Model Town' },
  { name: 'Company Bagh / Commissioner Office', lat: 30.0520, lng: 70.6350, zone: 'Civil Lines' },
  { name: 'DG Khan General Bus Stand (Lari Adda)', lat: 30.0680, lng: 70.6490, zone: 'Jampur Road' }
];
