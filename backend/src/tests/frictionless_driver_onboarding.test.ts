import assert from 'node:assert';

const API_BASE = process.env.API_BASE || 'https://pakride.onrender.com';

async function testFrictionlessDriverOnboarding() {
  console.log('\n====================================================');
  console.log('🏍️ TESTING FRICTIONLESS SIGNUP & POST-LOGIN VEHICLE SETUP');
  console.log(`🌐 Target: ${API_BASE}`);
  console.log('====================================================\n');

  // Step 1: Frictionless Driver Signup (No vehicle required)
  console.log('▶ [TEST 1/4] Frictionless Driver Signup (Name, Phone, Password, Role)...');
  const testPhone = '0333' + Math.floor(1000000 + Math.random() * 9000000);
  const signupRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Asad Rauf (Captain)',
      phone: testPhone,
      password: 'password123',
      role: 'DRIVER'
    })
  });
  assert.strictEqual(signupRes.status, 201, 'Signup should succeed with 201');
  const signupData: any = await signupRes.json();
  const driverToken = signupData.token;
  const driverUserId = signupData.user.id;
  assert.ok(driverToken, 'Token should be returned');
  assert.strictEqual(signupData.driverProfile?.verificationStatus, 'PENDING_DOCUMENTS', 'New driver must be in PENDING_DOCUMENTS status');
  console.log(`   ✔ Driver Registered: ${signupData.user.fullName} (${testPhone}) with status: PENDING_DOCUMENTS`);

  // Step 2: Ensure unverified driver cannot go online
  console.log('▶ [TEST 2/4] Verifying unverified driver cannot go online...');
  const onlineAttemptRes = await fetch(`${API_BASE}/api/driver/toggle-online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    }
  });
  assert.strictEqual(onlineAttemptRes.status, 403, 'Should be forbidden to go online');
  console.log('   ✔ Successfully blocked driver from going online before document submission & approval');

  // Step 3: Post-Login Vehicle & Document Submission
  console.log('▶ [TEST 3/4] Driver submits Bike Plate, Registration Copy, CNIC & Photo post-login...');
  const sampleDoc = 'data:image/svg+xml;utf8,<svg><text>Bike Reg Copy KHI-7788</text></svg>';
  const samplePhoto = 'data:image/svg+xml;utf8,<svg><text>Captain Selfie</text></svg>';

  const docRes = await fetch(`${API_BASE}/api/driver/vehicle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    },
    body: JSON.stringify({
      category: 'MOTORCYCLE',
      make: 'Honda',
      model: 'CD 70',
      plateNumber: 'KHI-7788',
      color: 'Black',
      cnicNumber: '42201-9988776-1',
      licenseNumber: 'KHI-DL-77889',
      profilePhotoUrl: samplePhoto,
      vehicleDocUrl: sampleDoc,
      cnicDocUrl: sampleDoc
    })
  });
  assert.strictEqual(docRes.status, 200, 'Submitting vehicle & documents should succeed');
  const docData: any = await docRes.json();
  assert.strictEqual(docData.profile.verificationStatus, 'UNDER_REVIEW', 'Status should transition to UNDER_REVIEW');
  assert.strictEqual(docData.vehicle.plateNumber, 'KHI-7788', 'Vehicle plate number should be saved');
  console.log(`   ✔ Documents Submitted! Status transitioned to: ${docData.profile.verificationStatus} (Plate: ${docData.vehicle.plateNumber})`);

  // Step 4: Admin reviews and approves driver
  console.log('▶ [TEST 4/4] Admin reviews documents & approves driver...');
  const adminLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '03009999999', password: 'pakride123' })
  });
  const adminLoginData: any = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const adminDriversRes = await fetch(`${API_BASE}/api/admin/drivers`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminDriversData: any = await adminDriversRes.json();
  const foundDriver = adminDriversData.drivers.find((d: any) => d.userId === driverUserId);
  assert.ok(foundDriver, 'Admin should see the newly registered driver');
  assert.strictEqual(foundDriver.vehicle?.plateNumber, 'KHI-7788', 'Admin should see driver vehicle plate number');
  assert.ok(foundDriver.vehicleDocUrl, 'Admin should see vehicle registration copy');

  const approveRes = await fetch(`${API_BASE}/api/admin/drivers/${driverUserId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'APPROVED', reason: 'Verified Bike registration and CNIC' })
  });
  assert.strictEqual(approveRes.status, 200, 'Admin approval should succeed');
  const approveData: any = await approveRes.json();
  assert.strictEqual(approveData.profile.verificationStatus, 'APPROVED', 'Driver status should now be APPROVED');

  // Driver can now go online
  const toggleOnlineRes = await fetch(`${API_BASE}/api/driver/toggle-online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    }
  });
  assert.strictEqual(toggleOnlineRes.status, 200, 'Approved driver should now be able to go online');
  const toggleData: any = await toggleOnlineRes.json();
  assert.strictEqual(toggleData.profile.isOnline, true, 'Driver is now ONLINE');
  console.log('   ✔ Admin approved driver! Driver is now ONLINE and ready to take rides in Karachi.');

  console.log('\n====================================================');
  console.log('🏆 FRICTIONLESS ONBOARDING TEST PASSED (100%)!');
  console.log('====================================================\n');
}

testFrictionlessDriverOnboarding().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
