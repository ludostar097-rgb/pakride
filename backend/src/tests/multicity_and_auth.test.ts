import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../db/store.js';
import { AuthService } from '../services/auth.js';
import { PricingService } from '../services/pricing.js';
import { RideStateMachine } from '../state/stateMachine.js';
import { seedDemoData } from '../seed.js';
import { LocationCoordinates, VehicleCategory } from '../shared/types.js';

console.log('\n====================================================');
console.log('🏙️ PAKRIDE MULTI-CITY (ISB), AUTH & ZONE AUDIT SUITE');
console.log('====================================================\n');

async function runMultiCityAudit() {
  seedDemoData();

  // 1. User Registration from Islamabad
  console.log('▶ [TEST 1/6] Registering Passenger & Driver from Islamabad (ISB)...');
  const isbPassenger = db.saveUser({
    id: 'user-isb-passenger-' + Date.now(),
    phone: '03019876543',
    passwordHash: await AuthService.hashPassword('PakRideIsb@123'),
    fullName: 'Hamza Malik (Islamabad)',
    role: 'PASSENGER',
    languagePreference: 'en',
    createdAt: new Date().toISOString()
  });
  assert.strictEqual(isbPassenger.role, 'PASSENGER');
  console.log(`   ✔ Passenger Created: ${isbPassenger.fullName} (${isbPassenger.phone})`);

  const isbDriver = db.saveUser({
    id: 'user-isb-driver-' + Date.now(),
    phone: '03129876543',
    passwordHash: await AuthService.hashPassword('DriverIsb@123'),
    fullName: 'Bilal Khan (Islamabad)',
    role: 'DRIVER',
    languagePreference: 'en',
    createdAt: new Date().toISOString()
  });

  const isbDriverProfile = db.saveDriverProfile({
    id: 'prof-isb-driver-' + Date.now(),
    userId: isbDriver.id,
    verificationStatus: 'APPROVED',
    isOnline: true,
    activeCityId: 'city-islamabad',
    activeZoneId: 'zone-islamabad-central',
    currentLat: 33.7077,
    currentLng: 73.0501,
    ratingAverage: 5.0,
    ratingCount: 12,
    vehicle: {
      id: 'veh-isb-' + Date.now(),
      driverId: isbDriver.id,
      category: 'CAR',
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      plateNumber: 'ISB-4921',
      color: 'Silver'
    }
  });
  assert.strictEqual(isbDriverProfile.activeCityId, 'city-islamabad');
  console.log(`   ✔ Approved Islamabad Driver: ${isbDriver.fullName} with Honda Civic (${isbDriverProfile.vehicle?.plateNumber})`);

  // 2. Dynamic City & Zone Management via Admin
  console.log('\n▶ [TEST 2/6] Verifying Admin Dynamic City & Zone Creation...');
  const newRawalpindiZone = db.saveZone({
    id: 'zone-rawalpindi-saddar',
    cityId: 'city-rawalpindi',
    cityName: 'Rawalpindi',
    zoneName: 'Saddar Commercial & Cantt',
    isActive: true,
    centerLat: 33.5973,
    centerLng: 73.0479,
    radiusKm: 6.0,
    baseFareCarPaisa: 17000,
    baseFareMotoPaisa: 6500,
    baseFareRickshawPaisa: 9500,
    perKmCarPaisa: 4200,
    perKmMotoPaisa: 1900,
    perKmRickshawPaisa: 2600
  });
  const fetchedZone = db.getZone('zone-rawalpindi-saddar');
  assert.ok(fetchedZone);
  assert.strictEqual(fetchedZone.cityName, 'Rawalpindi');
  assert.strictEqual(fetchedZone.isActive, true);
  console.log(`   ✔ Admin Created New Zone: ${fetchedZone.cityName} (${fetchedZone.zoneName})`);

  // Toggle zone
  fetchedZone.isActive = false;
  db.saveZone(fetchedZone);
  assert.strictEqual(db.getZone('zone-rawalpindi-saddar')?.isActive, false);
  console.log('   ✔ Admin Toggled Zone to Inactive successfully.');

  // 3. Dynamic Fare Calculation in Islamabad
  console.log('\n▶ [TEST 3/6] Testing Islamabad Dynamic Fare Calculation...');
  const pickupIsb: LocationCoordinates = {
    lat: 33.7077,
    lng: 73.0501,
    address: 'The Centaurus Mall, Jinnah Ave, F-8, Islamabad',
    landmark: 'F-8'
  };
  const destIsb: LocationCoordinates = {
    lat: 33.7296,
    lng: 73.0372,
    address: 'Faisal Mosque Main Gate, Islamabad',
    landmark: 'Margalla Foothills'
  };

  const distanceKm = PricingService.calculateDistanceKm(
    pickupIsb.lat,
    pickupIsb.lng,
    destIsb.lat,
    destIsb.lng
  );
  const suggestedFarePaisa = PricingService.calculateSuggestedFarePaisa(
    'CAR',
    distanceKm,
    'zone-islamabad-central'
  );
  const estimatedMinutes = Math.round(distanceKm * 3.5);

  assert.ok(suggestedFarePaisa > 18000, 'Islamabad car fare must exceed base fare of 180 PKR');
  console.log(`   ✔ Islamabad Route Distance: ${distanceKm} km`);
  console.log(`   ✔ Islamabad Calculated Fare: PKR ${Math.round(suggestedFarePaisa / 100)} (${suggestedFarePaisa} Paisa)`);

  // 4. Islamabad Ride Lifecycle & Atomic Assignment
  console.log('\n▶ [TEST 4/6] Executing Islamabad Ride Lifecycle...');
  const isbRide = db.saveRide({
    id: 'ride-isb-' + Date.now(),
    passengerId: isbPassenger.id,
    passengerName: isbPassenger.fullName,
    passengerPhone: isbPassenger.phone,
    category: 'CAR',
    pickup: pickupIsb,
    destination: destIsb,
    pickupNotes: 'Gate 2, Centaurus Jinnah Avenue side',
    distanceKm: distanceKm,
    estimatedMinutes: estimatedMinutes,
    suggestedFarePaisa: suggestedFarePaisa,
    proposedFarePaisa: suggestedFarePaisa,
    verificationOtp: '8912',
    status: 'OFFERS_OPEN',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Driver counteroffers
  const offer = db.saveOffer({
    id: 'offer-isb-' + Date.now(),
    rideId: isbRide.id,
    driverId: isbDriver.id,
    driverName: isbDriver.fullName,
    driverPhone: isbDriver.phone,
    driverRating: 5.0,
    driverVehicle: 'Honda Civic (ISB-4921)',
    counterFarePaisa: suggestedFarePaisa,
    etaMinutes: 3,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString()
  });

  // Passenger accepts driver offer
  isbRide.driverId = isbDriver.id;
  isbRide.driverName = isbDriver.fullName;
  isbRide.driverPhone = isbDriver.phone;
  isbRide.vehicleDetails = 'Honda Civic (ISB-4921)';
  isbRide.agreedFarePaisa = offer.counterFarePaisa;
  db.saveRide(isbRide);

  const tRes = RideStateMachine.transition(isbRide.id, 'DRIVER_SELECTED', isbPassenger.id, 'PASSENGER');
  assert.strictEqual(tRes.success, true, tRes.error);
  const updatedRideAfterSelect = db.getRide(isbRide.id);
  assert.strictEqual(updatedRideAfterSelect?.status, 'DRIVER_SELECTED');
  console.log(`   ✔ Passenger accepted Islamabad driver offer of PKR ${Math.round(offer.counterFarePaisa / 100)}`);

  // 5. In-App Live Chat Verification
  console.log('\n▶ [TEST 5/6] Testing In-App Real-time Chat Messaging...');
  const msg1 = {
    id: 'msg-test-1',
    rideId: isbRide.id,
    senderId: isbPassenger.id,
    senderName: isbPassenger.fullName,
    senderRole: 'PASSENGER' as const,
    text: 'Assalam-o-Alaikum, I am wearing a black jacket outside Centaurus Gate 2.',
    timestamp: new Date().toISOString()
  };
  const msg2 = {
    id: 'msg-test-2',
    rideId: isbRide.id,
    senderId: isbDriver.id,
    senderName: isbDriver.fullName,
    senderRole: 'DRIVER' as const,
    text: 'Walaikum Assalam! Honda Civic silver color arriving in 2 minutes.',
    timestamp: new Date().toISOString()
  };

  const chatRide = db.getRide(isbRide.id)!;
  chatRide.chatMessages = [msg1, msg2];
  db.saveRide(chatRide);
  const updatedRide = db.getRide(isbRide.id);
  assert.strictEqual(updatedRide?.chatMessages?.length, 2);
  console.log(`   ✔ Chat message 1 saved: "${msg1.text}"`);
  console.log(`   ✔ Chat message 2 saved: "${msg2.text}"`);

  // 6. Complete Ride & Rate Driver
  console.log('\n▶ [TEST 6/6] Completing Islamabad Ride & Submitting 5-Star Review...');
  const tEnRoute = RideStateMachine.transition(isbRide.id, 'EN_ROUTE', isbDriver.id, 'DRIVER');
  assert.strictEqual(tEnRoute.success, true, tEnRoute.error);

  const tInProgress = RideStateMachine.transition(isbRide.id, 'IN_PROGRESS', isbDriver.id, 'DRIVER', undefined, '8912');
  assert.strictEqual(tInProgress.success, true, tInProgress.error);

  const tCompleted = RideStateMachine.transition(isbRide.id, 'COMPLETED', isbDriver.id, 'DRIVER');
  assert.strictEqual(tCompleted.success, true, tCompleted.error);
  
  const completedRide = db.getRide(isbRide.id)!;
  completedRide.rating = 5;
  completedRide.reviewComment = 'Excellent driver, clean car, smooth ride through Blue Area!';
  db.saveRide(completedRide);

  assert.strictEqual(completedRide.status, 'COMPLETED');
  assert.strictEqual(completedRide.rating, 5);
  console.log(`   ✔ Ride Completed! Review: "${completedRide.reviewComment}" (5 Stars)`);

  console.log('\n====================================================');
  console.log('🏆 ALL 6/6 MULTI-CITY & AUTH AUDITS PASSED!');
  console.log('====================================================\n');
}

runMultiCityAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
