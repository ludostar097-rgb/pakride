import assert from 'node:assert';

const API_BASE = process.env.API_BASE || 'https://pakride.onrender.com';

async function testSaddarToFaisalMasjidFlow() {
  console.log('\n======================================================');
  console.log('🕌 PAKRIDE E2E TEST: SADDAR TO FAISAL MASJID TRIP FLOW');
  console.log(`🌐 Target Server: ${API_BASE}`);
  console.log('======================================================\n');

  // STEP 1: Authenticate Passenger (Ali Khan: 03001234567)
  console.log('▶ [1/6] Authenticating Passenger...');
  const passLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '03001234567', password: 'pakride123' })
  });
  const passData: any = await passLoginRes.json();
  assert.ok(passData.token, 'Passenger token required');
  const passengerToken = passData.token;
  console.log(`   ✔ Passenger Authenticated: ${passData.user.fullName} (${passData.user.id})`);

  // STEP 2: Authenticate Driver (Tariq Mehmood: 03007654321)
  console.log('\n▶ [2/6] Authenticating Driver...');
  const driverLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '03007654321', password: 'pakride123' })
  });
  const driverData: any = await driverLoginRes.json();
  assert.ok(driverData.token, 'Driver token required');
  const driverToken = driverData.token;
  const driverUserId = driverData.user.id;
  console.log(`   ✔ Driver Authenticated: ${driverData.user.fullName} (Vehicle: ${driverData.driverProfile?.vehicle?.make} ${driverData.driverProfile?.vehicle?.model})`);

  // Ensure Driver is Online
  if (!driverData.driverProfile?.isOnline) {
    await fetch(`${API_BASE}/api/driver/toggle-online`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
  }

  // STEP 3: Passenger requests ride: Saddar -> Faisal Masjid
  console.log('\n▶ [3/6] Passenger requests ride from Saddar to Faisal Masjid...');
  const pickupLocation = {
    address: 'Saddar Rawalpindi (Bank Road / Cantt)',
    lat: 33.5930,
    lng: 73.0545,
    landmark: 'Saddar'
  };
  const destinationLocation = {
    address: 'Faisal Mosque Main Gate, Islamabad',
    lat: 33.7296,
    lng: 73.0372,
    landmark: 'Faisal Masjid'
  };

  // Calculate fare estimate
  const fareRes = await fetch(`${API_BASE}/api/rides/calculate-fare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'CAR',
      pickup: pickupLocation,
      destination: destinationLocation
    })
  });
  const fareData: any = await fareRes.json();
  console.log(`   ✔ Route Distance: ${fareData.distanceKm} km | Suggested Fare: PKR ${fareData.suggestedFarePkr}`);

  // Submit ride request
  const proposedFare = fareData.suggestedFarePkr || 450;
  const requestRes = await fetch(`${API_BASE}/api/rides/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({
      category: 'CAR',
      pickup: pickupLocation,
      destination: destinationLocation,
      proposedFarePkr: proposedFare,
      pickupNotes: 'Waiting near Bank Road metro station gate'
    })
  });
  const requestData: any = await requestRes.json();
  assert.ok(requestData.ride?.id, 'Ride should be created');
  const rideId = requestData.ride.id;
  console.log(`   ✔ Ride Created: ${rideId} | Proposed Fare: PKR ${proposedFare} | Status: ${requestData.ride.status}`);

  // STEP 4: Driver submits offer (Driver accepts fare or submits counteroffer)
  console.log('\n▶ [4/6] Driver accepts & submits offer...');
  const driverOfferFare = proposedFare; // Driver accepts requested fare
  const offerRes = await fetch(`${API_BASE}/api/rides/${rideId}/offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({
      counterFarePkr: driverOfferFare,
      etaMinutes: 5
    })
  });
  const offerData: any = await offerRes.json();
  assert.ok(offerData.offer?.id, 'Driver offer should be created');
  const offerId = offerData.offer.id;
  console.log(`   ✔ Driver Offer Submitted: Offer ID ${offerId} for PKR ${driverOfferFare} (ETA: 5 mins)`);

  // STEP 5: Passenger sees offer and accepts/approves it
  console.log('\n▶ [5/6] Passenger checks incoming offers & approves Driver offer...');
  const passActiveRes = await fetch(`${API_BASE}/api/rides/passenger/active-ride`, {
    headers: { Authorization: `Bearer ${passengerToken}` }
  });
  const passActiveData: any = await passActiveRes.json();
  assert.ok(passActiveData.ride, 'Passenger should see active ride');
  assert.ok(passActiveData.offers.length > 0, 'Passenger should see driver offers');
  console.log(`   ✔ Passenger Screen shows ${passActiveData.offers.length} Offer: Driver ${passActiveData.offers[0].driverName} (PKR ${passActiveData.offers[0].counterFarePkr})`);

  // Passenger approves the offer
  const selectRes = await fetch(`${API_BASE}/api/rides/${rideId}/select-offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({ offerId })
  });
  const selectData: any = await selectRes.json();
  assert.strictEqual(selectData.ride.status, 'DRIVER_SELECTED', 'Status must be DRIVER_SELECTED');
  assert.ok(selectData.ride.verificationOtp, 'Passenger must have a 4-digit security PIN');
  const ridePin = selectData.ride.verificationOtp;
  console.log(`   ✔ Passenger Approved Driver! Ride Status: ${selectData.ride.status}`);
  console.log(`   ✔ Security PIN Generated for Passenger: ${ridePin}`);

  // STEP 6: Driver executes and completes trip
  console.log('\n▶ [6/6] Driver workflow: Arrive -> Enter PIN -> Complete Trip...');
  // Driver checks active trip
  const driverActiveRes = await fetch(`${API_BASE}/api/rides/driver/active-trip`, {
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  const driverActiveData: any = await driverActiveRes.json();
  assert.strictEqual(driverActiveData.ride?.id, rideId, 'Driver sees assigned trip');

  // 1. Driver arrives
  const arriveRes = await fetch(`${API_BASE}/api/rides/${rideId}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'EN_ROUTE' })
  });
  const arriveData: any = await arriveRes.json();
  assert.strictEqual(arriveData.ride.status, 'EN_ROUTE');
  console.log('   ✔ Driver Marked Arrived: EN_ROUTE');

  // 2. Driver enters passenger PIN to start trip
  const startRes = await fetch(`${API_BASE}/api/rides/${rideId}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'IN_PROGRESS', otp: ridePin })
  });
  const startData: any = await startRes.json();
  assert.strictEqual(startData.ride.status, 'IN_PROGRESS');
  console.log(`   ✔ Driver entered PIN ${ridePin}: Trip is now IN_PROGRESS towards Faisal Mosque!`);

  // 3. Driver completes trip
  const completeRes = await fetch(`${API_BASE}/api/rides/${rideId}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({ newStatus: 'COMPLETED' })
  });
  const completeData: any = await completeRes.json();
  assert.strictEqual(completeData.ride.status, 'COMPLETED');
  console.log('   ✔ Trip COMPLETED at Faisal Mosque! Passenger paid in Cash.');

  // Passenger submits review
  await fetch(`${API_BASE}/api/rides/${rideId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${passengerToken}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Smooth journey from Saddar to Faisal Masjid, polite driver!'
    })
  });
  console.log('   ✔ Passenger submitted 5-Star Review: "Smooth journey from Saddar to Faisal Masjid, polite driver!"');

  console.log('\n======================================================');
  console.log('🏆 SADDAR TO FAISAL MASJID E2E TEST PASSED (100%)!');
  console.log('======================================================\n');
}

testSaddarToFaisalMasjidFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
