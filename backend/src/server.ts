import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/store.js';
import { AuthService, AuthenticatedRequest } from './services/auth.js';
import { PricingService } from './services/pricing.js';
import { RideStateMachine } from './state/stateMachine.js';
import { LedgerService } from './services/ledger.js';
import { seedDemoData } from './seed.js';
import { SOCKET_EVENTS, KARACHI_LANDMARKS, ISLAMABAD_LANDMARKS } from './shared/constants.js';
import {
  RideRequest,
  RideOffer,
  VehicleCategory,
  LocationCoordinates,
  PaymentMethod
} from './shared/types.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// 0. HEALTH CHECK & KEEP-ALIVE ENDPOINTS
// ==========================================

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'PakRide Real-Time Dispatch Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req, res) => {
  return res.status(200).send('OK');
});

// Seed synthetic data on startup if empty
seedDemoData();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  const user = db.getUserByPhone(phone);
  if (!user) {
    return res.status(401).json({ error: 'Invalid phone or credentials' });
  }

  const valid = await AuthService.verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid phone or credentials' });
  }

  const token = AuthService.generateToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
    fullName: user.fullName
  });

  const driverProfile = user.role === 'DRIVER' ? db.getDriverProfile(user.id) : undefined;

  return res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      languagePreference: user.languagePreference,
      createdAt: user.createdAt
    },
    driverProfile
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { phone, fullName, role, password, languagePreference, vehicleDetails } = req.body;

  if (!phone || !fullName || !role || !password) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const existing = db.getUserByPhone(phone);
  if (existing) {
    return res.status(400).json({ error: 'User with this phone number already exists' });
  }

  const passwordHash = await AuthService.hashPassword(password);
  const newUser = {
    id: 'user-' + uuidv4().substring(0, 8),
    phone,
    fullName,
    role,
    languagePreference: languagePreference || 'en',
    createdAt: new Date().toISOString(),
    passwordHash
  };

  db.saveUser(newUser);

  let driverProfile = undefined;
  if (role === 'DRIVER') {
    let vehicle = undefined;
    const hasVehicleInfo = vehicleDetails && vehicleDetails.plateNumber && vehicleDetails.plateNumber.trim() !== '';

    if (hasVehicleInfo) {
      vehicle = {
        id: 'veh-' + uuidv4().substring(0, 8),
        driverId: newUser.id,
        category: (vehicleDetails?.category || 'MOTORCYCLE') as VehicleCategory,
        make: vehicleDetails?.make || 'Honda',
        model: vehicleDetails?.model || 'CD 70',
        year: vehicleDetails?.year || 2022,
        plateNumber: vehicleDetails?.plateNumber,
        color: vehicleDetails?.color || 'Black'
      };
      db.saveVehicle(vehicle);
    }

    driverProfile = {
      id: 'prof-' + uuidv4().substring(0, 8),
      userId: newUser.id,
      verificationStatus: hasVehicleInfo ? ('UNDER_REVIEW' as const) : ('PENDING_DOCUMENTS' as const),
      isOnline: false,
      activeCityId: 'city-karachi',
      activeZoneId: 'zone-karachi-jauhar',
      ratingAverage: 5.0,
      ratingCount: 0,
      cnicNumber: vehicleDetails?.cnicNumber || '',
      licenseNumber: vehicleDetails?.licenseNumber || '',
      profilePhotoUrl: vehicleDetails?.profilePhotoUrl || '',
      vehicleDocUrl: vehicleDetails?.vehicleDocUrl || '',
      cnicDocUrl: vehicleDetails?.cnicDocUrl || '',
      vehicle
    };
    db.saveDriverProfile(driverProfile);
  }

  const token = AuthService.generateToken({
    userId: newUser.id,
    phone: newUser.phone,
    role: newUser.role,
    fullName: newUser.fullName
  });

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      phone: newUser.phone,
      fullName: newUser.fullName,
      role: newUser.role,
      languagePreference: newUser.languagePreference,
      createdAt: newUser.createdAt
    },
    driverProfile
  });
});

// Simulated OTP storage for password reset
const resetOtpStore: Record<string, { otp: string; expiresAt: number }> = {};

app.post('/api/auth/forgot-password', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const user = db.getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'No account found with this phone number' });

  // Generate 4-digit reset OTP
  const otp = '7788'; // Predictable demo code, plus randomized fallback
  resetOtpStore[phone] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

  return res.json({
    success: true,
    message: 'Reset OTP sent to your phone (Demo OTP: 7788)',
    demoOtp: otp
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  if (!phone || !otp || !newPassword) {
    return res.status(400).json({ error: 'Phone, OTP, and new password are required' });
  }

  const record = resetOtpStore[phone];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP code' });
  }

  const user = db.getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.passwordHash = await AuthService.hashPassword(newPassword);
  db.saveUser(user);
  delete resetOtpStore[phone];

  return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
});

app.get('/api/auth/me', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.getUser(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const driverProfile = user.role === 'DRIVER' ? db.getDriverProfile(user.id) : undefined;
  return res.json({ user, driverProfile });
});

// ==========================================
// 2. FARE CALCULATION & ZONES
// ==========================================

app.get('/api/zones', (req, res) => {
  const zones = db.getZones();
  return res.json({
    zones,
    landmarks: KARACHI_LANDMARKS,
    karachiLandmarks: KARACHI_LANDMARKS,
    islamabadLandmarks: ISLAMABAD_LANDMARKS
  });
});

app.post('/api/admin/zones', AuthService.requireAuth, AuthService.requireRole(['ADMIN']), (req, res) => {
  const { cityName, zoneName, centerLat, centerLng, radiusKm, baseFareCarPaisa, perKmCarPaisa } = req.body;
  if (!cityName || !zoneName || !centerLat || !centerLng) {
    return res.status(400).json({ error: 'City, zone name, and center coordinates are required' });
  }

  const newZone = {
    id: 'zone-' + cityName.toLowerCase() + '-' + Date.now().toString(36),
    cityId: 'city-' + cityName.toLowerCase(),
    cityName,
    zoneName,
    isActive: true,
    centerLat: Number(centerLat),
    centerLng: Number(centerLng),
    radiusKm: Number(radiusKm) || 7.0,
    baseFareCarPaisa: Number(baseFareCarPaisa) || 16000,
    baseFareMotoPaisa: 6500,
    baseFareRickshawPaisa: 9500,
    perKmCarPaisa: Number(perKmCarPaisa) || 4200,
    perKmMotoPaisa: 1900,
    perKmRickshawPaisa: 2600
  };

  db.saveZone(newZone);
  return res.status(201).json({ zone: newZone });
});

app.post('/api/admin/zones/:zoneId/toggle', AuthService.requireAuth, AuthService.requireRole(['ADMIN']), (req, res) => {
  const zoneId = req.params.zoneId as string;
  const zone = db.getZone(zoneId);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  zone.isActive = !zone.isActive;
  db.saveZone(zone);
  return res.json({ zone });
});

app.post('/api/rides/calculate-fare', (req, res) => {
  const { category, pickup, destination, zoneId } = req.body as {
    category: VehicleCategory;
    pickup: LocationCoordinates;
    destination: LocationCoordinates;
    zoneId?: string;
  };

  if (!category || !pickup || !destination) {
    return res.status(400).json({ error: 'category, pickup, and destination are required' });
  }

  const distanceKm = PricingService.calculateDistanceKm(
    pickup.lat,
    pickup.lng,
    destination.lat,
    destination.lng
  );

  // Automatically detect operational zone from pickup coordinates
  const matchedZone = PricingService.findMatchingZone(pickup.lat, pickup.lng);
  const activeZoneId = zoneId || matchedZone?.id || 'zone-karachi-jauhar';

  const suggestedFarePaisa = PricingService.calculateSuggestedFarePaisa(
    category,
    distanceKm,
    activeZoneId
  );

  const estimatedMinutes = Math.max(Math.round(distanceKm * 3.5), 5);

  return res.json({
    distanceKm,
    estimatedMinutes,
    suggestedFarePaisa,
    suggestedFarePkr: Math.round(suggestedFarePaisa / 100),
    currency: 'PKR',
    category,
    detectedZone: matchedZone ? { id: matchedZone.id, cityName: matchedZone.cityName, zoneName: matchedZone.zoneName } : undefined
  });
});

// ==========================================
// 3. RIDE REQUEST & DISPATCH ENGINE
// ==========================================

app.post('/api/rides/request', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const { category, pickup, destination, proposedFarePkr, zoneId, pickupNotes } = req.body;

  if (!category || !pickup || !destination || !proposedFarePkr) {
    return res.status(400).json({ error: 'Missing required ride fields' });
  }

  const distanceKm = PricingService.calculateDistanceKm(
    pickup.lat,
    pickup.lng,
    destination.lat,
    destination.lng
  );

  // Automatically detect operational zone from pickup coordinates
  const matchedZone = PricingService.findMatchingZone(pickup.lat, pickup.lng);
  const activeZoneId = zoneId || matchedZone?.id || 'zone-karachi-jauhar';

  const suggestedFarePaisa = PricingService.calculateSuggestedFarePaisa(
    category,
    distanceKm,
    activeZoneId
  );

  const proposedFarePaisa = Math.round(Number(proposedFarePkr) * 100);

  const newRide: RideRequest = {
    id: 'ride-' + uuidv4().substring(0, 8),
    passengerId: req.user!.userId,
    passengerName: req.user!.fullName,
    passengerPhone: req.user!.phone,
    category,
    pickup,
    destination,
    pickupNotes: pickupNotes || undefined,
    distanceKm,
    estimatedMinutes: Math.max(Math.round(distanceKm * 3.5), 5),
    suggestedFarePaisa,
    proposedFarePaisa,
    status: 'REQUESTED',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.saveRide(newRide);

  // Transition to OFFERS_OPEN automatically
  RideStateMachine.transition(newRide.id, 'OFFERS_OPEN', req.user!.userId, req.user!.role);

  // Broadcast to all online drivers in the zone via Socket.io
  io.emit(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, newRide);

  return res.status(201).json({ ride: db.getRide(newRide.id) });
});

app.get('/api/rides/:id', AuthService.requireAuth, (req, res) => {
  const rideId = req.params.id as string;
  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  const offers = db.getOffersForRide(ride.id);
  return res.json({ ride, offers });
});

app.get('/api/rides/passenger/active-ride', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const allRides = db.getAllRides();
  const active = allRides.find(
    (r) =>
      r.passengerId === req.user!.userId &&
      r.status !== 'COMPLETED' &&
      r.status !== 'CANCELLED'
  );
  const offers = active ? db.getOffersForRide(active.id) : [];
  return res.json({ ride: active || null, offers });
});

app.get('/api/rides/driver/active-trip', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const allRides = db.getAllRides();
  const active = allRides.find(
    (r) =>
      r.driverId === req.user!.userId &&
      (r.status === 'DRIVER_SELECTED' || r.status === 'EN_ROUTE' || r.status === 'IN_PROGRESS')
  );
  return res.json({ ride: active || null });
});

app.get('/api/rides/passenger/history', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rides = db.getRidesForPassenger(req.user!.userId);
  return res.json({ rides });
});

// Driver available rides feed
app.get('/api/rides/driver/feed', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const driverProfile = db.getDriverProfile(req.user!.userId);
  if (!driverProfile) {
    return res.status(403).json({ error: 'Driver profile required' });
  }

  // Non-negotiable rule: unapproved or offline drivers cannot receive requests
  if (driverProfile.verificationStatus !== 'APPROVED') {
    return res.status(403).json({
      error: 'Driver is not approved by administrator. Documents under review.'
    });
  }

  if (!driverProfile.isOnline) {
    return res.json({ rides: [], message: 'Driver is offline' });
  }

  const category = driverProfile.vehicle?.category || 'ALL';
  const rides = db.getAvailableRidesForDrivers(category, driverProfile.activeZoneId);
  return res.json({ rides });
});

// ==========================================
// 4. COUNTEROFFERS & ATOMIC SELECTION
// ==========================================

app.post('/api/rides/:id/offer', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rideId = req.params.id as string;
  const { counterFarePkr, etaMinutes } = req.body;

  const driverProfile = db.getDriverProfile(req.user!.userId);
  if (!driverProfile || driverProfile.verificationStatus !== 'APPROVED') {
    return res.status(403).json({ error: 'Only approved drivers can submit offers' });
  }
  if (!driverProfile.isOnline) {
    return res.status(400).json({ error: 'You must be online to submit offers' });
  }

  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride request not found' });

  if (ride.status !== 'OFFERS_OPEN' && ride.status !== 'REQUESTED') {
    return res.status(400).json({ error: 'This ride is no longer accepting offers' });
  }

  const counterFarePaisa = Math.round(Number(counterFarePkr) * 100);

  const offer: RideOffer = {
    id: 'off-' + uuidv4().substring(0, 8),
    rideId,
    driverId: req.user!.userId,
    driverName: req.user!.fullName,
    driverPhone: req.user!.phone,
    driverRating: driverProfile.ratingAverage,
    driverVehicle: `${driverProfile.vehicle?.color || ''} ${driverProfile.vehicle?.make || ''} ${driverProfile.vehicle?.model || ''} (${driverProfile.vehicle?.plateNumber || ''})`,
    counterFarePaisa,
    etaMinutes: etaMinutes || 4,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
  };

  db.saveOffer(offer);

  // Notify the passenger specifically in real-time
  io.to(`user:${ride.passengerId}`).emit(SOCKET_EVENTS.NEW_OFFER_RECEIVED, {
    rideId,
    offer
  });

  return res.status(201).json({ offer });
});

app.post('/api/rides/:id/select-offer', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rideId = req.params.id as string;
  const { offerId } = req.body;

  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });

  if (ride.passengerId !== req.user!.userId) {
    return res.status(403).json({ error: 'Only the requesting passenger can accept an offer' });
  }

  const offer = db.getOffer(offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  // Atomic Assignment: Locks winning driver, atomically rejects all other offers
  const assigned = db.selectOfferAtomically(rideId, offerId, offer.driverId);
  if (!assigned) {
    return res.status(409).json({
      error: 'Could not assign ride: It may have already been claimed or cancelled'
    });
  }

  const updatedRide = db.getRide(rideId)!;

  // Real-time broadcasts:
  // 1. Notify winning driver
  io.to(`user:${offer.driverId}`).emit(SOCKET_EVENTS.OFFER_ACCEPTED_NOTIFY, {
    ride: updatedRide,
    offer
  });

  // 2. Notify passenger room
  io.to(`user:${ride.passengerId}`).emit(SOCKET_EVENTS.RIDE_STATUS_CHANGED, {
    ride: updatedRide
  });

  // 3. Broadcast to all other drivers that the ride is now closed
  io.emit(SOCKET_EVENTS.RIDE_CANCELLED_BROADCAST, { rideId });

  return res.json({ success: true, ride: updatedRide });
});

// ==========================================
// 5. RIDE LIFECYCLE PROGRESSION & COMPLETION
// ==========================================

app.post('/api/rides/:id/transition', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rideId = req.params.id as string;
  const { newStatus, reason, otp, verificationOtp } = req.body;
  const pinToVerify = otp || verificationOtp;

  const result = RideStateMachine.transition(
    rideId,
    newStatus,
    req.user!.userId,
    req.user!.role,
    reason,
    pinToVerify
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const ride = db.getRide(rideId)!;

  // If completed, record ledger transaction automatically
  if (newStatus === 'COMPLETED') {
    LedgerService.recordRidePayment(ride, ride.paymentMethod || 'CASH');
  }

  // Notify both driver and passenger of the state change
  io.to(`user:${ride.passengerId}`).emit(SOCKET_EVENTS.RIDE_STATUS_CHANGED, { ride });
  if (ride.driverId) {
    io.to(`user:${ride.driverId}`).emit(SOCKET_EVENTS.RIDE_STATUS_CHANGED, { ride });
  }

  return res.json({ success: true, ride });
});

// Chat Endpoints
app.post('/api/rides/:id/chat', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rideId = req.params.id as string;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text is required' });

  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });

  const msg = {
    id: 'msg-' + uuidv4().substring(0, 8),
    rideId,
    senderId: req.user!.userId,
    senderName: req.user!.fullName,
    senderRole: req.user!.role,
    text,
    timestamp: new Date().toISOString()
  };

  if (!ride.chatMessages) ride.chatMessages = [];
  ride.chatMessages.push(msg);
  db.saveRide(ride);

  // Broadcast in real-time to both passenger and driver
  io.to(`user:${ride.passengerId}`).emit('ride_chat_message', { rideId, message: msg });
  if (ride.driverId) {
    io.to(`user:${ride.driverId}`).emit('ride_chat_message', { rideId, message: msg });
  }

  return res.status(201).json({ message: msg });
});

app.get('/api/rides/:id/chat', AuthService.requireAuth, (req, res) => {
  const rideId = req.params.id as string;
  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  return res.json({ messages: ride.chatMessages || [] });
});

// Rating & Reviews
app.post('/api/rides/:id/rate', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const rideId = req.params.id as string;
  const { rating, reviewComment } = req.body;

  const ride = db.getRide(rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });

  ride.rating = Number(rating) || 5;
  ride.reviewComment = reviewComment || '';
  db.saveRide(ride);

  if (ride.driverId) {
    const driverProfile = db.getDriverProfile(ride.driverId);
    if (driverProfile) {
      const currentTotal = driverProfile.ratingAverage * driverProfile.ratingCount;
      driverProfile.ratingCount += 1;
      driverProfile.ratingAverage = Math.round(((currentTotal + ride.rating) / driverProfile.ratingCount) * 10) / 10;
      db.saveDriverProfile(driverProfile);
    }
  }

  return res.json({ success: true, ride });
});

// ==========================================
// 6. DRIVER MANAGEMENT & ONLINE STATUS
// ==========================================

app.post('/api/driver/toggle-online', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const profile = db.getDriverProfile(req.user!.userId);
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  // Non-negotiable security control: Unapproved driver cannot go online
  if (profile.verificationStatus !== 'APPROVED') {
    return res.status(403).json({
      error: 'Cannot go online. Driver verification status is: ' + profile.verificationStatus
    });
  }

  profile.isOnline = !profile.isOnline;
  db.saveDriverProfile(profile);

  return res.json({ profile });
});

app.get('/api/driver/earnings', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const allLedger = db.getLedger();
  const driverEntries = allLedger.filter((l) => l.driverId === req.user!.userId);

  let totalGrossPaisa = 0;
  let totalCommissionPaisa = 0;
  let totalNetPaisa = 0;

  for (const entry of driverEntries) {
    totalGrossPaisa += entry.grossAmountPaisa;
    totalCommissionPaisa += entry.platformCommissionPaisa;
    totalNetPaisa += entry.driverNetPaisa;
  }

  return res.json({
    driverId: req.user!.userId,
    completedTripsCount: driverEntries.length,
    totalGrossPkr: Math.round(totalGrossPaisa / 100),
    totalCommissionPkr: Math.round(totalCommissionPaisa / 100),
    totalNetPkr: Math.round(totalNetPaisa / 100),
    history: driverEntries
  });
});

app.post('/api/driver/vehicle', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    category,
    make,
    model,
    year,
    plateNumber,
    color,
    cnicNumber,
    licenseNumber,
    profilePhotoUrl,
    vehicleDocUrl,
    cnicDocUrl
  } = req.body;

  const profile = db.getDriverProfile(req.user!.userId);
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const existingVehicle = profile.vehicle || db.getVehicleByDriver(req.user!.userId);

  const vehicle = {
    id: existingVehicle?.id || ('veh-' + uuidv4().substring(0, 8)),
    driverId: req.user!.userId,
    category: (category || existingVehicle?.category || 'MOTORCYCLE') as VehicleCategory,
    make: make || existingVehicle?.make || 'Honda',
    model: model || existingVehicle?.model || 'CD 70',
    year: Number(year) || existingVehicle?.year || 2022,
    plateNumber: plateNumber || existingVehicle?.plateNumber || 'KHI-0000',
    color: color || existingVehicle?.color || 'Black'
  };

  db.saveVehicle(vehicle);
  profile.vehicle = vehicle;

  if (cnicNumber !== undefined) profile.cnicNumber = cnicNumber;
  if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
  if (profilePhotoUrl !== undefined) profile.profilePhotoUrl = profilePhotoUrl;
  if (vehicleDocUrl !== undefined) profile.vehicleDocUrl = vehicleDocUrl;
  if (cnicDocUrl !== undefined) profile.cnicDocUrl = cnicDocUrl;

  // If status is PENDING_DOCUMENTS, transition to UNDER_REVIEW
  if (profile.verificationStatus === 'PENDING_DOCUMENTS') {
    profile.verificationStatus = 'UNDER_REVIEW';
  }

  db.saveDriverProfile(profile);

  return res.json({ success: true, profile, vehicle });
});

// ==========================================
// 7. ADMIN CONTROL CENTRE & INCIDENT MGMT
// ==========================================

app.get('/api/admin/drivers', AuthService.requireAuth, AuthService.requireRole(['ADMIN', 'CITY_MANAGER']), (req, res) => {
  const drivers = db.getAllDrivers();
  const users = db.getAllUsers();

  const enriched = drivers.map((d) => {
    const user = users.find((u) => u.id === d.userId);
    return {
      ...d,
      fullName: user?.fullName || 'Unknown',
      phone: user?.phone || 'Unknown'
    };
  });

  return res.json({ drivers: enriched });
});

app.post('/api/admin/drivers/:userId/approve', AuthService.requireAuth, AuthService.requireRole(['ADMIN', 'CITY_MANAGER']), (req: AuthenticatedRequest, res) => {
  const { status, reason } = req.body;
  const targetUserId = req.params.userId as string;
  const profile = db.getDriverProfile(targetUserId);
  if (!profile) return res.status(404).json({ error: 'Driver not found' });

  profile.verificationStatus = status;
  db.saveDriverProfile(profile);

  db.logAudit({
    eventType: 'DRIVER_VERIFICATION_STATUS_CHANGED',
    actorId: req.user!.userId,
    actorRole: req.user!.role,
    payload: { targetDriverId: targetUserId, newStatus: status, reason }
  });

  return res.json({ profile });
});

app.get('/api/admin/rides', AuthService.requireAuth, AuthService.requireRole(['ADMIN', 'CITY_MANAGER']), (req, res) => {
  const rides = db.getAllRides().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ rides });
});

app.get('/api/admin/ledger', AuthService.requireAuth, AuthService.requireRole(['ADMIN', 'CITY_MANAGER']), (req, res) => {
  const ledger = db.getLedger();
  return res.json({ ledger });
});

app.get('/api/admin/audit', AuthService.requireAuth, AuthService.requireRole(['ADMIN']), (req, res) => {
  const audits = db.getAuditEvents();
  return res.json({ audits });
});

app.get('/api/admin/settings', AuthService.requireAuth, AuthService.requireRole(['ADMIN']), (req, res) => {
  return res.json({ settings: db.getSettings() });
});

app.put('/api/admin/settings', AuthService.requireAuth, AuthService.requireRole(['ADMIN']), (req, res) => {
  const updated = db.updateSettings(req.body);
  return res.json({ settings: updated });
});

// Complaints / Incidents
app.post('/api/complaints', AuthService.requireAuth, (req: AuthenticatedRequest, res) => {
  const { rideId, category, severity, description } = req.body;
  const complaint = {
    id: 'comp-' + uuidv4().substring(0, 8),
    rideId,
    reportedByUserId: req.user!.userId,
    category: category || 'SAFETY',
    severity: severity || 'MEDIUM',
    description,
    status: 'OPEN' as const,
    createdAt: new Date().toISOString()
  };
  db.saveComplaint(complaint);
  return res.status(201).json({ complaint });
});

app.get('/api/admin/complaints', AuthService.requireAuth, AuthService.requireRole(['ADMIN', 'CITY_MANAGER']), (req, res) => {
  const complaints = db.getAllComplaints();
  return res.json({ complaints });
});

// ==========================================
// 8. REAL-TIME SOCKET.IO EVENT HANDLERS
// ==========================================

io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // User joins their personal room for direct notifications
  socket.on(SOCKET_EVENTS.JOIN_USER_ROOM, (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`[SOCKET] User ${userId} joined room user:${userId}`);
  });

  // Driver broadcasts live GPS updates (restricted to pilot area)
  socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, (data: { driverId: string; lat: number; lng: number }) => {
    const profile = db.getDriverProfile(data.driverId);
    if (profile && profile.isOnline) {
      profile.currentLat = data.lat;
      profile.currentLng = data.lng;
      db.saveDriverProfile(profile);

      // Broadcast position to passenger tracking this driver
      io.emit(SOCKET_EVENTS.DRIVER_POSITION_BROADCAST, data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` PakRide Backend & Real-Time Engine running on port ${PORT}`);
  console.log(` Environment: Pilot Zone (Karachi - Gulistan-e-Jauhar)`);
  console.log(` Platform Commission: 0% Introductory rate`);
  console.log(` Database: Persistent Atomic JSON Store with Minor Units`);
  console.log(`=======================================================`);

  // Automatic Keep-Alive Self-Pinger (keeps Render free instances awake)
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL || 'https://pakride.onrender.com';
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true') {
    const PING_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes (Render spins down after 15 mins)
    setInterval(async () => {
      try {
        const pingUrl = `${externalUrl}/api/health`;
        const res = await fetch(pingUrl);
        if (res.ok) {
          console.log(`[KEEP-ALIVE] Pinged ${pingUrl} at ${new Date().toISOString()} (HTTP 200)`);
        }
      } catch (err: any) {
        console.warn(`[KEEP-ALIVE] Ping notice:`, err?.message || err);
      }
    }, PING_INTERVAL_MS);
    console.log(`[KEEP-ALIVE] Self-pinger active for ${externalUrl} every 13 minutes.`);
  }
});
