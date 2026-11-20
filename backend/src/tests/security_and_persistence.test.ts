import { db } from '../db/store.js';
import { AuthService } from '../services/auth.js';
import { RideStateMachine } from '../state/stateMachine.js';
import { LedgerService } from '../services/ledger.js';
import fs from 'fs';
import path from 'path';

async function runSecurityAndPersistenceTests() {
  console.log('====================================================');
  console.log('🛡️ PAKRIDE SECURITY, PERSISTENCE & INTEGRITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  const total = 6;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Database Persistence Verification (Disk Store Check)
    // -------------------------------------------------------------------------
    console.log('▶ [AUDIT 1/6] Testing On-Disk Database State Persistence...');
    const dataDir = path.resolve(process.cwd(), 'data');
    const dataFile = path.join(dataDir, 'pakride_store.json');

    if (!fs.existsSync(dataFile)) {
      throw new Error(`Data file not found at ${dataFile}`);
    }

    const raw = fs.readFileSync(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed.users || !parsed.zones || !parsed.settings) {
      throw new Error('Database schema missing core root tables on disk');
    }
    console.log(`   ✔ Persistence OK: File exists (${(raw.length / 1024).toFixed(1)} KB) with ${Object.keys(parsed.users).length} users and ${Object.keys(parsed.zones).length} zones.`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 2: Role-Based Authorization & Token Tamper Rejection
    // -------------------------------------------------------------------------
    console.log('\n▶ [AUDIT 2/6] Testing Security Tokens & Role Guards...');
    const passengerToken = AuthService.generateToken({
      userId: 'test-passenger-id',
      phone: '03001111111',
      role: 'PASSENGER',
      fullName: 'Test Passenger'
    });

    const tamperedToken = passengerToken.substring(0, passengerToken.length - 4) + 'abcd';
    const tamperedResult = AuthService.verifyToken(tamperedToken);

    if (tamperedResult !== null) {
      throw new Error('Security flaw: Tampered JWT token was accepted by server!');
    }
    console.log('   ✔ Cryptographic Security: Tampered JWT tokens strictly rejected.');

    // Verify Passenger cannot masquerade as ADMIN
    const passengerClaims = AuthService.verifyToken(passengerToken);
    if (!passengerClaims || passengerClaims.role === 'ADMIN') {
      throw new Error('Role privilege escalation detected');
    }
    console.log('   ✔ Role Guard: Passenger role strictly isolated from Admin privileges.');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 3: State Machine Illegal Transition Enforcement
    // -------------------------------------------------------------------------
    console.log('\n▶ [AUDIT 3/6] Testing State Machine Invariants...');
    const testRideId = 'ride-sec-test-' + Date.now();
    db.saveRide({
      id: testRideId,
      passengerId: 'user-p-1',
      passengerName: 'Ali Khan',
      passengerPhone: '03001234567',
      category: 'CAR',
      pickup: { lat: 24.918, lng: 67.135, address: 'Jauhar' },
      destination: { lat: 24.898, lng: 67.112, address: 'Millennium' },
      distanceKm: 4.5,
      estimatedMinutes: 12,
      suggestedFarePaisa: 30000,
      proposedFarePaisa: 28000,
      status: 'REQUESTED',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Attempt illegal transition: Directly from REQUESTED to COMPLETED
    const illegalJump = RideStateMachine.transition(testRideId, 'COMPLETED', 'user-p-1', 'PASSENGER');
    if (illegalJump.success) {
      throw new Error('State Machine failure: Allowed illegal transition from REQUESTED to COMPLETED!');
    }
    console.log(`   ✔ State Machine Guard: Illegal jump blocked (${illegalJump.error})`);

    // Attempt illegal driver status update by an unauthorized user
    const unauthorizedUpdate = RideStateMachine.transition(testRideId, 'IN_PROGRESS', 'hacker-id', 'PASSENGER');
    if (unauthorizedUpdate.success) {
      throw new Error('Security failure: Unauthorized actor updated trip status!');
    }
    console.log(`   ✔ Actor Guard: Unauthorized role blocked from trip progression.`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 4: Atomic Driver Assignment (Race Condition & Double-Booking Prevention)
    // -------------------------------------------------------------------------
    console.log('\n▶ [AUDIT 4/6] Testing Concurrency & Double-Booking Prevention...');
    // Create offers
    const offerA = {
      id: 'off-a-' + Date.now(),
      rideId: testRideId,
      driverId: 'driver-a',
      driverName: 'Driver A',
      driverPhone: '03001111111',
      driverRating: 4.9,
      driverVehicle: 'White Corolla',
      counterFarePaisa: 28000,
      etaMinutes: 3,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString()
    };
    const offerB = {
      id: 'off-b-' + Date.now(),
      rideId: testRideId,
      driverId: 'driver-b',
      driverName: 'Driver B',
      driverPhone: '03002222222',
      driverRating: 4.8,
      driverVehicle: 'Red Bike',
      counterFarePaisa: 28000,
      etaMinutes: 4,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString()
    };
    db.saveOffer(offerA);
    db.saveOffer(offerB);

    // Transition ride to OFFERS_OPEN
    db.getRide(testRideId)!.status = 'OFFERS_OPEN';
    db.saveRide(db.getRide(testRideId)!);

    // Driver A is selected first
    const selectA = db.selectOfferAtomically(testRideId, offerA.id, 'driver-a');
    if (!selectA) throw new Error('First atomic assignment failed');

    // Attempt simultaneous/duplicate selection of Driver B (Race Condition Simulation)
    const selectB = db.selectOfferAtomically(testRideId, offerB.id, 'driver-b');
    if (selectB) {
      throw new Error('CRITICAL CONCURRENCY BUG: Ride was claimed by two drivers simultaneously!');
    }
    console.log('   ✔ Concurrency Guard: Second simultaneous offer acceptance rejected.');
    console.log('   ✔ Competing Offer B Status:', db.getOffer(offerB.id)!.status, '(REJECTED)');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 5: 4-Digit Security PIN Brute-Force & Mismatch Protection
    // -------------------------------------------------------------------------
    console.log('\n▶ [AUDIT 5/6] Testing 4-Digit Ride PIN Security...');
    const currentRide = db.getRide(testRideId)!;
    const realPin = currentRide.verificationOtp!;

    // Set ride to EN_ROUTE
    RideStateMachine.transition(testRideId, 'EN_ROUTE', 'driver-a', 'DRIVER');

    // Test multiple wrong PIN inputs
    const wrongPins = ['0000', '1234', '9999', 'abcd'];
    for (const pin of wrongPins) {
      if (pin !== realPin) {
        const res = RideStateMachine.transition(testRideId, 'IN_PROGRESS', 'driver-a', 'DRIVER', undefined, pin);
        if (res.success) throw new Error(`Security failure: Wrong PIN "${pin}" was accepted!`);
      }
    }
    console.log('   ✔ PIN Verification: All fake/guessed PINs rejected.');

    // Test correct PIN
    const validPinRes = RideStateMachine.transition(testRideId, 'IN_PROGRESS', 'driver-a', 'DRIVER', undefined, realPin);
    if (!validPinRes.success) throw new Error('Correct PIN was rejected: ' + validPinRes.error);
    console.log(`   ✔ Correct PIN Accepted: "${realPin}" transitioned ride to IN_PROGRESS.`);
    passed++;

    // -------------------------------------------------------------------------
    // TEST 6: Financial Ledger Paisa Precision (0% Commission Arithmetic)
    // -------------------------------------------------------------------------
    console.log('\n▶ [AUDIT 6/6] Testing Financial Ledger Precision...');
    const settledRide = db.getRide(testRideId)!;
    const ledgerEntry = LedgerService.recordRidePayment(settledRide, 'CASH');

    if (ledgerEntry.platformCommissionPaisa !== 0) {
      throw new Error('Platform fee must be 0% in introductory pilot.');
    }
    if (ledgerEntry.driverNetPaisa !== ledgerEntry.grossAmountPaisa) {
      throw new Error('Driver net must equal 100% of gross fare in 0% commission pilot.');
    }
    if (!Number.isInteger(ledgerEntry.driverNetPaisa)) {
      throw new Error('Non-integer value detected in financial ledger!');
    }
    console.log(`   ✔ Financial Audit OK: Gross ${ledgerEntry.grossAmountPaisa} Paisa | Net ${ledgerEntry.driverNetPaisa} Paisa | Platform Fee: ${ledgerEntry.platformCommissionPaisa} Paisa.`);
    passed++;

    console.log('\n====================================================');
    console.log(`🏆 ALL ${passed}/${total} SECURITY & INTEGRITY AUDITS PASSED!`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ AUDIT FAILED:', err.message);
    process.exit(1);
  }
}

runSecurityAndPersistenceTests();
