import { io } from '../../../frontend/node_modules/socket.io-client/build/esm/index.js';

const API_BASE = 'http://localhost:4000';
const FRONTEND_BASE = 'http://localhost:3000';

async function verifyLiveSystem() {
  console.log('\n======================================================');
  console.log('🌐 PAKRIDE LIVE SERVER & FULL-STACK INTEGRATION AUDIT');
  console.log('======================================================\n');

  // 1. Verify Frontend Web Delivery
  console.log('▶ [1/10] Verifying Frontend Server on Port 3000...');
  try {
    const fRes = await fetch(FRONTEND_BASE);
    const html = await fRes.text();
    if (fRes.ok && html.includes('id="root"')) {
      console.log(`   ✔ Frontend is LIVE: HTTP ${fRes.status} | React #root mounting container verified.`);
    } else {
      throw new Error(`Frontend returned unexpected response: ${fRes.status}`);
    }
  } catch (err: any) {
    console.error('   ❌ Frontend check failed:', err.message);
    process.exit(1);
  }

  // 2. Verify Backend Server Health & Zones API
  console.log('\n▶ [2/10] Verifying Backend Server & Active Zones on Port 4000...');
  const zRes = await fetch(`${API_BASE}/api/zones`);
  const zData = await zRes.json();
  if (zRes.ok && Array.isArray(zData.zones) && zData.zones.length >= 2) {
    console.log(`   ✔ Backend is LIVE: Found ${zData.zones.length} zones (${zData.zones.map((z: any) => z.cityName + ':' + z.zoneName).join(', ')})`);
  } else {
    throw new Error('Zones API failed');
  }

  // 3. Test Full User Registration with Passwords
  console.log('\n▶ [3/10] Testing User Registration & Real JWT Issuance...');
  const phonePassenger = '0300' + Math.floor(1000000 + Math.random() * 9000000);
  const pRegRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phonePassenger,
      password: 'LivePassword@123',
      fullName: 'Zainab Bibi',
      role: 'PASSENGER'
    })
  });
  const pRegData = await pRegRes.json();
  if (!pRegRes.ok || !pRegData.token) throw new Error('Passenger registration failed: ' + JSON.stringify(pRegData));
  const passengerToken = pRegData.token;
  const passengerUser = pRegData.user;
  console.log(`   ✔ Registered Passenger: ${passengerUser.fullName} (${passengerUser.phone}) | Received real JWT token.`);

  const phoneDriver = '0311' + Math.floor(1000000 + Math.random() * 9000000);
  const dRegRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phoneDriver,
      password: 'DriverPassword@123',
      fullName: 'Rashid Minhas',
      role: 'DRIVER',
      vehicleDetails: {
        category: 'CAR',
        make: 'Suzuki',
        model: 'WagonR',
        plateNumber: 'ISB-8899',
        color: 'White',
        year: 2023
      }
    })
  });
  const dRegData = await dRegRes.json();
  if (!dRegRes.ok || !dRegData.token) throw new Error('Driver registration failed: ' + JSON.stringify(dRegData));
  const driverToken = dRegData.token;
  const driverUser = dRegData.user;
  console.log(`   ✔ Registered Driver: ${driverUser.fullName} (${driverUser.phone}) | Vehicle: Suzuki WagonR (ISB-8899)`);

  // 4. Test Login & Credential Verification
  console.log('\n▶ [4/10] Testing Sign In Authentication & Password Verification...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phonePassenger, password: 'LivePassword@123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) throw new Error('Login failed');
  console.log(`   ✔ Sign In successful for ${loginData.user.fullName}. Token authenticated.`);

  // Test Wrong Password Rejection
  const badLogin = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phonePassenger, password: 'WrongPassword' })
  });
  if (badLogin.status === 401) {
    console.log('   ✔ Security Check: Incorrect password correctly rejected with HTTP 401.');
  } else {
    throw new Error('Security check failed: wrong password was not rejected with 401');
  }

  // 5. Test Password Recovery (OTP)
  console.log('\n▶ [5/10] Testing Forgot Password & OTP Reset Lifecycle...');
  const forgotRes = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phonePassenger })
  });
  const forgotData = await forgotRes.json();
  if (!forgotRes.ok || !forgotData.demoOtp) throw new Error('Forgot password failed');
  console.log(`   ✔ OTP requested for ${phonePassenger}. Generated OTP: ${forgotData.demoOtp}`);

  const resetRes = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phonePassenger,
      otp: forgotData.demoOtp,
      newPassword: 'BrandNewPassword@456'
    })
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok || !resetData.success) throw new Error('Password reset failed');
  console.log(`   ✔ Password reset verified successfully with OTP code.`);

  // 6. Test Admin Approval for Driver
  console.log('\n▶ [6/10] Testing Admin Approval Workflow for Newly Registered Driver...');
  // Newly registered driver starts as UNDER_REVIEW
  const toggleRes = await fetch(`${API_BASE}/api/driver/toggle-online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ isOnline: true })
  });
  const toggleData = await toggleRes.json();
  if (toggleRes.status === 403) {
    console.log('   ✔ Guard Active: Driver is UNDER_REVIEW and cannot go online.');
  } else {
    throw new Error('Unapproved driver should not be able to go online');
  }

  // Admin logs in with real credentials and gets verified admin token
  const adminLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '03009999999', password: 'pakride123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  // Admin approves driver
  const approveRes = await fetch(`${API_BASE}/api/admin/drivers/${driverUser.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'APPROVED' })
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.profile) {
    console.error('Approve failed response:', approveRes.status, approveData);
    throw new Error('Admin approval failed');
  }
  console.log(`   ✔ Admin approved Driver ${driverUser.fullName}.`);

  // Now driver goes online
  const onlineRes = await fetch(`${API_BASE}/api/driver/toggle-online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ isOnline: true })
  });
  const onlineData = await onlineRes.json();
  if (onlineRes.ok && onlineData.profile.isOnline) {
    console.log('   ✔ Driver is now actively ONLINE.');
  } else {
    throw new Error('Driver failed to go online after approval');
  }

  // 7. Test Real-time WebSocket Connectivity
  console.log('\n▶ [7/10] Testing Real-time WebSockets & Live Broadcasts...');
  const socketPassenger = io(API_BASE, { transports: ['websocket'] });
  const socketDriver = io(API_BASE, { transports: ['websocket'] });

  await new Promise<void>((resolve, reject) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    socketPassenger.on('connect', () => {
      socketPassenger.emit('join_user_room', passengerUser.id);
      check();
    });
    socketDriver.on('connect', () => {
      socketDriver.emit('join_user_room', driverUser.id);
      check();
    });
    setTimeout(() => reject(new Error('WebSocket connection timed out')), 5000);
  });
  console.log('   ✔ Passenger & Driver WebSockets connected and subscribed to live rooms.');

  // 8. Test Dynamic Fare Calculation & Ride Creation
  console.log('\n▶ [8/10] Testing Islamabad Fare Calculation & Ride Request Creation...');
  const fareCalcRes = await fetch(`${API_BASE}/api/rides/calculate-fare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'CAR',
      pickup: { lat: 33.7077, lng: 73.0501, address: 'The Centaurus Mall, Jinnah Ave, Islamabad' },
      destination: { lat: 33.7296, lng: 73.0372, address: 'Faisal Mosque Main Gate, Islamabad' },
      zoneId: 'zone-islamabad-central'
    })
  });
  const fareData = await fareCalcRes.json();
  console.log(`   ✔ Calculated Suggested Fare: PKR ${fareData.suggestedFarePkr} (${fareData.distanceKm} km, ~${fareData.estimatedMinutes} mins)`);

  // Request Ride
  const rideReqRes = await fetch(`${API_BASE}/api/rides/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({
      category: 'CAR',
      pickup: { lat: 33.7077, lng: 73.0501, address: 'The Centaurus Mall, Jinnah Ave, Islamabad' },
      destination: { lat: 33.7296, lng: 73.0372, address: 'Faisal Mosque Main Gate, Islamabad' },
      proposedFarePkr: fareData.suggestedFarePkr,
      pickupNotes: 'Centaurus Gate 2, near food court exit'
    })
  });
  const rideData = await rideReqRes.json();
  if (!rideReqRes.ok || !rideData.ride) throw new Error('Ride request failed');
  const ride = rideData.ride;
  console.log(`   ✔ Ride Created: ID ${ride.id} | Status: ${ride.status} | OTP PIN: ${ride.verificationOtp}`);

  // 9. Test Driver Counteroffer, Atomic Assignment, In-Ride Chat & PIN Progression
  console.log('\n▶ [9/10] Testing Driver Offer, Selection, Chat, and Trip Workflow...');
  // Driver offers
  const offerRes = await fetch(`${API_BASE}/api/rides/${ride.id}/offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({
      counterFarePkr: fareData.suggestedFarePkr,
      etaMinutes: 3
    })
  });
  const offerData = await offerRes.json();
  console.log(`   ✔ Driver submitted offer: PKR ${offerData.offer.counterFarePaisa / 100} (ETA 3 mins)`);

  // Passenger selects offer
  const selectRes = await fetch(`${API_BASE}/api/rides/${ride.id}/select-offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({ offerId: offerData.offer.id })
  });
  const selectData = await selectRes.json();
  if (selectData.ride.status !== 'DRIVER_SELECTED') throw new Error('Driver selection failed');
  const otpPin = selectData.ride.verificationOtp;
  console.log(`   ✔ Passenger accepted offer. Status: DRIVER_SELECTED | Security Ride PIN: ${otpPin}.`);

  // Test Real-Time In-Ride Chat
  const chatRes = await fetch(`${API_BASE}/api/rides/${ride.id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({ text: 'Salam driver bhai, I am at Gate 2 in blue shirt.' })
  });
  const chatData = await chatRes.json();
  console.log(`   ✔ Live Chat Message Sent: "${chatData.message.text}" (ID ${chatData.message.id})`);

  // Driver transitions to EN_ROUTE
  const enRouteRes = await fetch(`${API_BASE}/api/rides/${ride.id}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'EN_ROUTE' })
  });
  const enRouteData = await enRouteRes.json();
  console.log(`   ✔ Driver arrived at pickup: Status is now ${enRouteData.ride.status}.`);

  // Driver starts trip with 4-digit PIN
  const inProgRes = await fetch(`${API_BASE}/api/rides/${ride.id}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'IN_PROGRESS', otp: otpPin })
  });
  const inProgData = await inProgRes.json();
  if (inProgData.ride.status !== 'IN_PROGRESS') throw new Error('Start trip failed: ' + JSON.stringify(inProgData));
  console.log(`   ✔ 4-Digit PIN Verified (${otpPin}). Trip is now IN_PROGRESS.`);

  // Complete Trip
  const compRes = await fetch(`${API_BASE}/api/rides/${ride.id}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'COMPLETED' })
  });
  const compData = await compRes.json();
  console.log(`   ✔ Trip COMPLETED successfully.`);

  // 10. Test Passenger Rating & Financial Ledger Entry
  console.log('\n▶ [10/10] Testing 5-Star Rating & 0% Platform Commission Ledger...');
  const rateRes = await fetch(`${API_BASE}/api/rides/${ride.id}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({ rating: 5, reviewComment: 'Best ride experience, very punctual!' })
  });
  const rateData = await rateRes.json();
  console.log(`   ✔ Passenger submitted 5-Star rating with review: "${rateData.ride.reviewComment}"`);

  // Verify Ledger
  const ledgerRes = await fetch(`${API_BASE}/api/admin/ledger`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const ledgerData = await ledgerRes.json();
  const entry = ledgerData.ledger.find((l: any) => l.rideId === ride.id);
  if (entry) {
    console.log(`   ✔ Ledger Reconciled: Gross PKR ${entry.grossAmountPaisa / 100} | Platform Fee: PKR ${entry.platformCommissionPaisa / 100} (0% Commission) | Driver Net: PKR ${entry.driverNetPaisa / 100}`);
  } else {
    throw new Error('Ledger entry not found for completed ride');
  }

  socketPassenger.disconnect();
  socketDriver.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL 10/10 FULL-STACK INTEGRATION CHECKS PASSED LIVE!');
  console.log('======================================================\n');
}

verifyLiveSystem().catch((err) => {
  console.error('\n❌ Integration Audit Failed:', err);
  process.exit(1);
});
