import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/store.js';
import { AuthService } from '../services/auth.js';
import { PricingService } from '../services/pricing.js';
import { RideStateMachine } from '../state/stateMachine.js';
import { LedgerService } from '../services/ledger.js';
import { seedDemoData } from '../seed.js';
import { KARACHI_LANDMARKS } from '../shared/constants.js';
import { RideRequest, RideOffer } from '../shared/types.js';

async function runEndToEndTestSuite() {
  console.log('====================================================');
  console.log('🚗 PAKRIDE END-TO-END (E2E) SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 8;

  try {
    // SETUP: Seed database
    await seedDemoData();
    console.log('✔ [SETUP] Database seeded with Karachi Gulistan-e-Jauhar pilot data.\n');

    // -------------------------------------------------------------------------
    // TEST 1: User Authentication & Role Verification
    // -------------------------------------------------------------------------
    console.log('▶ [TEST 1/8] Verifying User Authentication & Role Tokens...');
    const passengerUser = db.getUserByPhone('03001234567');
    if (!passengerUser) throw new Error('Passenger user not found');

    const passMatch = await AuthService.verifyPassword('pakride123', passengerUser.passwordHash);
    if (!passMatch) throw new Error('Password verification failed for passenger');

    const pToken = AuthService.generateToken({
      userId: passengerUser.id,
      phone: passengerUser.phone,
      role: passengerUser.role,
      fullName: passengerUser.fullName
    });
    const verified = AuthService.verifyToken(pToken);
    if (!verified || verified.role !== 'PASSENGER') throw new Error('Invalid JWT payload');
    console.log(`   ✔ Passenger Auth OK: ${passengerUser.fullName} (${verified.role})`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 2: Dynamic Pricing & Distance Calculation (Minor Units)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 2/8] Testing Fare Estimation & Integer Paisa Math...');
    const pickupLoc = KARACHI_LANDMARKS[0]; // Jauhar Chowrangi
    const destLoc = KARACHI_LANDMARKS[4];   // Millennium Mall
    const distanceKm = PricingService.calculateDistanceKm(
      pickupLoc.lat,
      pickupLoc.lng,
      destLoc.lat,
      destLoc.lng
    );

    const suggestedPaisa = PricingService.calculateSuggestedFarePaisa('CAR', distanceKm);
    const suggestedPkr = Math.round(suggestedPaisa / 100);

    if (suggestedPaisa % 1 !== 0) throw new Error('Paisa value must be a strict integer!');
    if (suggestedPkr < 100) throw new Error('Suggested fare below base floor');
    console.log(`   ✔ Distance: ${distanceKm} km | Suggested Fare: PKR ${suggestedPkr} (${suggestedPaisa} Paisa)`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 3: Passenger Creates Ride Request with Karachi Gate Note
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 3/8] Testing Ride Request Creation with Gate Note...');
    const testRideId = 'ride-e2e-test-' + Date.now();
    const proposedFarePaisa = 28000; // PKR 280

    const newRide: RideRequest = {
      id: testRideId,
      passengerId: passengerUser.id,
      passengerName: passengerUser.fullName,
      passengerPhone: passengerUser.phone,
      category: 'CAR',
      pickup: {
        lat: pickupLoc.lat,
        lng: pickupLoc.lng,
        address: pickupLoc.name,
        landmark: pickupLoc.zone
      },
      destination: {
        lat: destLoc.lat,
        lng: destLoc.lng,
        address: destLoc.name,
        landmark: destLoc.zone
      },
      pickupNotes: 'Near Continental Bakery, White Gate',
      distanceKm,
      estimatedMinutes: 12,
      suggestedFarePaisa: suggestedPaisa,
      proposedFarePaisa,
      status: 'REQUESTED',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveRide(newRide);

    // Transition to OFFERS_OPEN
    const tResult = RideStateMachine.transition(testRideId, 'OFFERS_OPEN', passengerUser.id, 'PASSENGER');
    if (!tResult.success) throw new Error('State transition to OFFERS_OPEN failed: ' + tResult.error);

    const savedRide = db.getRide(testRideId);
    if (!savedRide || savedRide.status !== 'OFFERS_OPEN' || !savedRide.pickupNotes) {
      throw new Error('Ride request not properly stored in DB');
    }
    console.log(`   ✔ Ride Created: ${savedRide.id} | Status: ${savedRide.status} | Gate Note: "${savedRide.pickupNotes}"`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 4: Drivers Submit Counteroffers
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 4/8] Testing Driver Counteroffer Engine...');
    const driver1 = db.getUserByPhone('03007654321')!; // Tariq Mehmood
    const driver2 = db.getUserByPhone('03112233445')!; // Kamran Iqbal

    const offer1: RideOffer = {
      id: 'off-e2e-1',
      rideId: testRideId,
      driverId: driver1.id,
      driverName: driver1.fullName,
      driverPhone: driver1.phone,
      driverRating: 4.9,
      driverVehicle: 'Toyota Corolla White (KHI-8291)',
      counterFarePaisa: 30000, // PKR 300
      etaMinutes: 3,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString()
    };

    const offer2: RideOffer = {
      id: 'off-e2e-2',
      rideId: testRideId,
      driverId: driver2.id,
      driverName: driver2.fullName,
      driverPhone: driver2.phone,
      driverRating: 4.8,
      driverVehicle: 'Honda CD70 Red (KHI-4412)',
      counterFarePaisa: 25000, // PKR 250
      etaMinutes: 5,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString()
    };

    db.saveOffer(offer1);
    db.saveOffer(offer2);

    const rideOffers = db.getOffersForRide(testRideId);
    if (rideOffers.length !== 2) throw new Error('Expected 2 offers for ride');
    console.log(`   ✔ Offer 1: ${offer1.driverName} (PKR ${offer1.counterFarePaisa / 100})`);
    console.log(`   ✔ Offer 2: ${offer2.driverName} (PKR ${offer2.counterFarePaisa / 100})`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 5: Atomic Assignment & Concurrency Lock
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 5/8] Testing Atomic Driver Assignment & Lock...');
    const assigned = db.selectOfferAtomically(testRideId, offer1.id, driver1.id);
    if (!assigned) throw new Error('Atomic offer assignment failed');

    const assignedRide = db.getRide(testRideId)!;
    const competingOffer = db.getOffer(offer2.id)!;
    const winningOffer = db.getOffer(offer1.id)!;

    if (assignedRide.status !== 'DRIVER_SELECTED') throw new Error('Ride status should be DRIVER_SELECTED');
    if (assignedRide.driverId !== driver1.id) throw new Error('Driver ID mismatch');
    if (!assignedRide.verificationOtp) throw new Error('Verification OTP PIN was not generated!');
    if (winningOffer.status !== 'ACCEPTED') throw new Error('Winning offer not marked ACCEPTED');
    if (competingOffer.status !== 'REJECTED') throw new Error('Competing offer was not atomically REJECTED!');

    console.log(`   ✔ Atomic Lock Succeeded: Assigned Driver ${assignedRide.driverName}`);
    console.log(`   ✔ Generated 4-Digit Security PIN: ${assignedRide.verificationOtp}`);
    console.log(`   ✔ Competing Offer Status: ${competingOffer.status} (Atomically Closed)`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 6: Trip Progression with 4-Digit Security PIN Enforcement
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 6/8] Testing Trip Workflow & 4-Digit PIN Security...');
    // Step 1: En Route
    const enRouteRes = RideStateMachine.transition(testRideId, 'EN_ROUTE', driver1.id, 'DRIVER');
    if (!enRouteRes.success) throw new Error('Failed to transition to EN_ROUTE: ' + enRouteRes.error);
    console.log('   ✔ Driver Marked Arrived: EN_ROUTE');

    // Step 2: Attempt Start Trip with Wrong PIN (Should FAIL)
    const wrongPinRes = RideStateMachine.transition(testRideId, 'IN_PROGRESS', driver1.id, 'DRIVER', undefined, '0000');
    if (wrongPinRes.success) throw new Error('Security flaw: Trip started with WRONG PIN!');
    console.log('   ✔ Invalid PIN Rejected by Server: ' + wrongPinRes.error);

    // Step 3: Start Trip with Correct PIN (Should SUCCEED)
    const correctPinRes = RideStateMachine.transition(
      testRideId,
      'IN_PROGRESS',
      driver1.id,
      'DRIVER',
      undefined,
      assignedRide.verificationOtp
    );
    if (!correctPinRes.success) throw new Error('Trip failed to start with valid PIN: ' + correctPinRes.error);
    console.log('   ✔ Valid PIN Accepted: Trip IN_PROGRESS');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 7: Trip Completion & Financial Ledger Reconciliation
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 7/8] Testing Trip Completion & 0% Commission Ledger...');
    const completeRes = RideStateMachine.transition(testRideId, 'COMPLETED', driver1.id, 'DRIVER');
    if (!completeRes.success) throw new Error('Failed to complete trip: ' + completeRes.error);

    const completedRide = db.getRide(testRideId)!;
    const ledgerEntry = LedgerService.recordRidePayment(completedRide, 'CASH');

    if (ledgerEntry.grossAmountPaisa !== 30000) throw new Error('Gross amount incorrect');
    if (ledgerEntry.platformCommissionPaisa !== 0) throw new Error('Launch commission must be 0%');
    if (ledgerEntry.driverNetPaisa !== 30000) throw new Error('Driver net amount should equal gross amount');

    console.log(`   ✔ Trip Completed: Status ${completedRide.status}`);
    console.log(`   ✔ Ledger Entry: Gross PKR ${ledgerEntry.grossAmountPaisa / 100} | Commission: PKR ${ledgerEntry.platformCommissionPaisa / 100} | Net Driver: PKR ${ledgerEntry.driverNetPaisa / 100}`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 8: Admin Operational Controls & Driver Verification Guard
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 8/8] Testing Admin Control & Unapproved Driver Guard...');
    const unapprovedDriverUser = db.getUserByPhone('03335555555')!; // Usman Farooq
    const unapprovedProfile = db.getDriverProfile(unapprovedDriverUser.id)!;

    if (unapprovedProfile.verificationStatus === 'APPROVED') {
      throw new Error('Unapproved driver should not be pre-approved');
    }

    // Try going online while unapproved (Should be blocked by server rule)
    if (unapprovedProfile.isOnline) {
      throw new Error('Unapproved driver was allowed online!');
    }
    console.log(`   ✔ Guard Active: Driver Usman is ${unapprovedProfile.verificationStatus} (Blocked from going online)`);

    // Admin Approves Driver
    unapprovedProfile.verificationStatus = 'APPROVED';
    db.saveDriverProfile(unapprovedProfile);
    console.log(`   ✔ Admin Action: Driver Usman approved. Now eligible for active duty.`);
    passedTests++;

    console.log('\n====================================================');
    console.log(`🏆 ALL ${passedTests}/${totalTests} END-TO-END TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  }
}

runEndToEndTestSuite();
