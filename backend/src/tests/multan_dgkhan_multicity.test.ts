import assert from 'assert';
import { PricingService } from '../services/pricing.js';
import { OPERATING_CITIES, PILOT_ZONES, MULTAN_LANDMARKS, DGKHAN_LANDMARKS, getNearestOperatingCity } from '../shared/constants.js';

console.log('======================================================');
console.log('🏛️ PAKRIDE MULTI-CITY VERIFICATION: MULTAN & D.G. KHAN');
console.log('======================================================');

// 1. Verify Canonical City Registry
console.log('\n▶ [1/4] Verifying OPERATING_CITIES Registry...');
const multanCity = OPERATING_CITIES.find((c) => c.id === 'city-multan');
const dgkhanCity = OPERATING_CITIES.find((c) => c.id === 'city-dgkhan');

assert(multanCity, 'Multan must be registered in OPERATING_CITIES');
assert.strictEqual(multanCity.name, 'Multan');
assert.strictEqual(multanCity.centerLat, 30.1984);
assert.strictEqual(multanCity.centerLng, 71.4687);

assert(dgkhanCity, 'D.G. Khan must be registered in OPERATING_CITIES');
assert.strictEqual(dgkhanCity.name, 'D.G. Khan');
assert.strictEqual(dgkhanCity.centerLat, 30.0489);
assert.strictEqual(dgkhanCity.centerLng, 70.6455);
console.log('   ✔ Multan & D.G. Khan verified in OPERATING_CITIES');

// 2. Verify Nearest Operating City Resolution
console.log('\n▶ [2/4] Testing getNearestOperatingCity GPS resolver...');
const nearBzu = getNearestOperatingCity(30.2642, 71.4984);
assert.strictEqual(nearBzu.id, 'city-multan', 'BZU Multan must resolve to city-multan');

const nearTrafficChowk = getNearestOperatingCity(30.0561, 70.6402);
assert.strictEqual(nearTrafficChowk.id, 'city-dgkhan', 'Traffic Chowk DGK must resolve to city-dgkhan');

const nearFaisalMasjid = getNearestOperatingCity(33.7296, 73.0372);
assert.strictEqual(nearFaisalMasjid.id, 'city-islamabad', 'Faisal Masjid must resolve to city-islamabad');
console.log('   ✔ Accurate geographic resolution verified for all coordinates');

// 3. Verify Operational Zones & Pricing Tiers
console.log('\n▶ [3/4] Verifying Zone Fare Rules for Multan & D.G. Khan...');
const multanZone = PILOT_ZONES.find((z) => z.cityId === 'city-multan');
const dgkZone = PILOT_ZONES.find((z) => z.cityId === 'city-dgkhan');

assert(multanZone, 'Multan zone must be configured');
assert.strictEqual(multanZone.baseFareCarPaisa, 14000, 'Multan car base fare is PKR 140');
assert.strictEqual(multanZone.perKmCarPaisa, 3500, 'Multan car per km rate is PKR 35');

assert(dgkZone, 'D.G. Khan zone must be configured');
assert.strictEqual(dgkZone.baseFareCarPaisa, 12000, 'DG Khan car base fare is PKR 120');
assert.strictEqual(dgkZone.perKmCarPaisa, 3000, 'DG Khan car per km rate is PKR 30');
console.log('   ✔ Zone base and per-km pricing verified');

// 4. Verify Landmarks Dictionary
console.log('\n▶ [4/4] Verifying Landmarks Dictionary...');
assert(MULTAN_LANDMARKS.length >= 5, 'Multan landmarks must have at least 5 locations');
assert(DGKHAN_LANDMARKS.length >= 5, 'D.G. Khan landmarks must have at least 5 locations');

assert(MULTAN_LANDMARKS.some((l) => l.name.includes('Ghanta Ghar')));
assert(MULTAN_LANDMARKS.some((l) => l.name.includes('BZU')));
assert(DGKHAN_LANDMARKS.some((l) => l.name.includes('Pull Dat')));
assert(DGKHAN_LANDMARKS.some((l) => l.name.includes('Traffic Chowk')));
console.log('   ✔ Multan landmarks: ' + MULTAN_LANDMARKS.map((l) => l.name.split(',')[0]).join(', '));
console.log('   ✔ D.G. Khan landmarks: ' + DGKHAN_LANDMARKS.map((l) => l.name.split(',')[0]).join(', '));

console.log('\n======================================================');
console.log('🏆 MULTAN & D.G. KHAN ARCHITECTURE PASSED (100%)!');
console.log('======================================================\n');
