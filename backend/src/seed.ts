import { db } from './db/store.js';
import { AuthService } from './services/auth.js';
import { PILOT_ZONES } from './shared/constants.js';

export async function seedDemoData() {
  console.log('[SEED] Seeding synthetic demonstration data...');

  const passwordHash = await AuthService.hashPassword('pakride123');

  // 1. Ensure Pilot Zone
  for (const zone of PILOT_ZONES) {
    db.saveZone(zone);
  }

  // 2. Seed Passenger 1 (Ali Khan) & Passenger 2 (Zainab Bibi)
  const passenger1 = {
    id: 'user-passenger-1',
    phone: '03001234567',
    fullName: 'Ali Khan',
    role: 'PASSENGER' as const,
    languagePreference: 'en' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(passenger1);

  const passenger2 = {
    id: 'user-passenger-2',
    phone: '03007443615',
    fullName: 'Zainab Bibi',
    role: 'PASSENGER' as const,
    languagePreference: 'ur' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(passenger2);

  // 3. Seed Driver 1 (Car - Approved & Online)
  const driver1User = {
    id: 'user-driver-car-1',
    phone: '03007654321',
    fullName: 'Tariq Mehmood',
    role: 'DRIVER' as const,
    languagePreference: 'ur' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(driver1User);

  const vehicle1 = {
    id: 'veh-car-1',
    driverId: driver1User.id,
    category: 'CAR' as const,
    make: 'Toyota',
    model: 'Corolla GLi',
    year: 2021,
    plateNumber: 'KHI-8291',
    color: 'White'
  };
  db.saveVehicle(vehicle1);

  db.saveDriverProfile({
    id: 'prof-driver-car-1',
    userId: driver1User.id,
    verificationStatus: 'APPROVED',
    isOnline: true,
    activeCityId: 'city-karachi',
    activeZoneId: 'zone-karachi-jauhar',
    currentLat: 24.919,
    currentLng: 67.136,
    ratingAverage: 4.9,
    ratingCount: 38,
    cnicNumber: '42201-1234567-1',
    licenseNumber: 'KHI-DL-99482',
    vehicle: vehicle1
  });

  // 4. Seed Driver 2 (Motorcycle - Approved & Online)
  const driver2User = {
    id: 'user-driver-moto-1',
    phone: '03112233445',
    fullName: 'Kamran Iqbal',
    role: 'DRIVER' as const,
    languagePreference: 'ur' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(driver2User);

  const vehicle2 = {
    id: 'veh-moto-1',
    driverId: driver2User.id,
    category: 'MOTORCYCLE' as const,
    make: 'Honda',
    model: 'CD 70',
    year: 2023,
    plateNumber: 'KHI-4412',
    color: 'Red'
  };
  db.saveVehicle(vehicle2);

  db.saveDriverProfile({
    id: 'prof-driver-moto-1',
    userId: driver2User.id,
    verificationStatus: 'APPROVED',
    isOnline: true,
    activeCityId: 'city-karachi',
    activeZoneId: 'zone-karachi-jauhar',
    currentLat: 24.914,
    currentLng: 67.131,
    ratingAverage: 4.8,
    ratingCount: 52,
    cnicNumber: '42101-7654321-3',
    licenseNumber: 'KHI-DL-11842',
    vehicle: vehicle2
  });

  // 5. Seed Driver 3 (Rickshaw - Approved & Online)
  const driver3User = {
    id: 'user-driver-rick-1',
    phone: '03229988776',
    fullName: 'Zubair Ahmed',
    role: 'DRIVER' as const,
    languagePreference: 'ur' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(driver3User);

  const vehicle3 = {
    id: 'veh-rick-1',
    driverId: driver3User.id,
    category: 'RICKSHAW' as const,
    make: 'Sazgar',
    model: '4-Stroke CNG',
    year: 2022,
    plateNumber: 'KHI-9931',
    color: 'Green'
  };
  db.saveVehicle(vehicle3);

  db.saveDriverProfile({
    id: 'prof-driver-rick-1',
    userId: driver3User.id,
    verificationStatus: 'APPROVED',
    isOnline: true,
    activeCityId: 'city-karachi',
    activeZoneId: 'zone-karachi-jauhar',
    currentLat: 24.925,
    currentLng: 67.139,
    ratingAverage: 4.7,
    ratingCount: 29,
    cnicNumber: '42201-9876543-5',
    licenseNumber: 'KHI-DL-43091',
    vehicle: vehicle3
  });

  // 6. Seed Driver 4 (Unapproved / Pending verification)
  const driver4User = {
    id: 'user-driver-pending-1',
    phone: '03335555555',
    fullName: 'Usman Farooq',
    role: 'DRIVER' as const,
    languagePreference: 'en' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(driver4User);

  const vehicle4 = {
    id: 'veh-car-pending',
    driverId: driver4User.id,
    category: 'CAR' as const,
    make: 'Suzuki',
    model: 'Alto VXR',
    year: 2022,
    plateNumber: 'KHI-3012',
    color: 'Silver'
  };
  db.saveVehicle(vehicle4);

  db.saveDriverProfile({
    id: 'prof-driver-pending',
    userId: driver4User.id,
    verificationStatus: 'UNDER_REVIEW',
    isOnline: false,
    activeCityId: 'city-karachi',
    activeZoneId: 'zone-karachi-jauhar',
    ratingAverage: 0,
    ratingCount: 0,
    cnicNumber: '42301-4433221-7',
    licenseNumber: 'KHI-DL-88219',
    vehicle: vehicle4
  });

  // 7. Seed Admin
  const adminUser = {
    id: 'user-admin-1',
    phone: '03009999999',
    fullName: 'Ahmad Hassan',
    role: 'ADMIN' as const,
    languagePreference: 'en' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(adminUser);

  // 8. Seed City Manager
  const managerUser = {
    id: 'user-manager-1',
    phone: '03008888888',
    fullName: 'Karachi Ops Lead',
    role: 'CITY_MANAGER' as const,
    languagePreference: 'en' as const,
    createdAt: new Date().toISOString(),
    passwordHash
  };
  db.saveUser(managerUser);

  console.log('[SEED] Demo data successfully initialized.');
}
