import fs from 'fs';
import path from 'path';
import {
  User,
  DriverProfile,
  Vehicle,
  RideRequest,
  RideOffer,
  PaymentLedgerEntry,
  CityZone
} from '../shared/types.js';
import { PILOT_ZONES } from '../shared/constants.js';

export interface AuditEvent {
  id: string;
  rideId?: string;
  eventType: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
  payload: any;
}

export interface Complaint {
  id: string;
  rideId: string;
  reportedByUserId: string;
  category: 'SAFETY' | 'FARE_DISPUTE' | 'BEHAVIOR' | 'VEHICLE_CONDITION' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface SystemSettings {
  introductoryCommissionPercent: number; // Defaults to 0%
  pilotZoneActive: boolean;
  activeCity: string;
  maintenanceMode: boolean;
}

export interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string }>;
  driverProfiles: Record<string, DriverProfile>;
  vehicles: Record<string, Vehicle>;
  rides: Record<string, RideRequest>;
  offers: Record<string, RideOffer>;
  ledger: Record<string, PaymentLedgerEntry>;
  complaints: Record<string, Complaint>;
  zones: Record<string, CityZone>;
  auditEvents: AuditEvent[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'pakride_store.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing defaults:', err);
    }

    const defaultZones: Record<string, CityZone> = {};
    for (const z of PILOT_ZONES) {
      defaultZones[z.id] = z;
    }

    return {
      users: {},
      driverProfiles: {},
      vehicles: {},
      rides: {},
      offers: {},
      ledger: {},
      complaints: {},
      zones: defaultZones,
      auditEvents: [],
      settings: {
        introductoryCommissionPercent: 0,
        pilotZoneActive: true,
        activeCity: 'Karachi',
        maintenanceMode: false
      }
    };
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err);
    }
  }

  // --- Users ---
  public getUser(id: string) {
    return this.data.users[id];
  }
  public getUserByPhone(phone: string) {
    return Object.values(this.data.users).find((u) => u.phone === phone);
  }
  public saveUser(user: User & { passwordHash: string }) {
    this.data.users[user.id] = user;
    this.save();
    return user;
  }
  public getAllUsers() {
    return Object.values(this.data.users);
  }

  // --- Drivers & Vehicles ---
  public getDriverProfile(userId: string) {
    return this.data.driverProfiles[userId];
  }
  public saveDriverProfile(profile: DriverProfile) {
    this.data.driverProfiles[profile.userId] = profile;
    this.save();
    return profile;
  }
  public getAllDrivers() {
    return Object.values(this.data.driverProfiles);
  }
  public getVehicle(id: string) {
    return this.data.vehicles[id];
  }
  public getVehicleByDriver(driverId: string) {
    return Object.values(this.data.vehicles).find((v) => v.driverId === driverId);
  }
  public saveVehicle(v: Vehicle) {
    this.data.vehicles[v.id] = v;
    this.save();
    return v;
  }

  // --- Rides ---
  public getRide(id: string) {
    return this.data.rides[id];
  }
  public saveRide(ride: RideRequest) {
    this.data.rides[ride.id] = ride;
    this.save();
    return ride;
  }
  public getAllRides() {
    return Object.values(this.data.rides);
  }
  public getRidesForPassenger(passengerId: string) {
    return Object.values(this.data.rides)
      .filter((r) => r.passengerId === passengerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getAvailableRidesForDrivers(category: string, zoneId?: string) {
    return Object.values(this.data.rides).filter(
      (r) =>
        (r.status === 'REQUESTED' || r.status === 'OFFERS_OPEN') &&
        (r.category === category || category === 'ALL')
    );
  }

  // --- Offers ---
  public getOffer(id: string) {
    return this.data.offers[id];
  }
  public getOffersForRide(rideId: string) {
    return Object.values(this.data.offers).filter((o) => o.rideId === rideId);
  }
  public saveOffer(offer: RideOffer) {
    this.data.offers[offer.id] = offer;
    this.save();
    return offer;
  }

  // --- Atomic Ride Assignment ---
  public selectOfferAtomically(rideId: string, offerId: string, selectedDriverId: string): boolean {
    const ride = this.data.rides[rideId];
    const offer = this.data.offers[offerId];

    if (!ride || !offer) return false;
    // Prevent double booking or invalid transitions
    if (ride.status !== 'OFFERS_OPEN' && ride.status !== 'REQUESTED') {
      return false;
    }
    if (offer.status !== 'PENDING') {
      return false;
    }

    // Atomically transition the ride
    ride.status = 'DRIVER_SELECTED';
    ride.driverId = selectedDriverId;
    ride.driverName = offer.driverName;
    ride.driverPhone = offer.driverPhone;
    ride.driverRating = offer.driverRating;
    ride.vehicleDetails = offer.driverVehicle;
    ride.agreedFarePaisa = offer.counterFarePaisa;
    ride.verificationOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
    ride.updatedAt = new Date().toISOString();

    // Mark winning offer as accepted
    offer.status = 'ACCEPTED';

    // Atomically reject or expire competing offers for this ride
    for (const off of Object.values(this.data.offers)) {
      if (off.rideId === rideId && off.id !== offerId && off.status === 'PENDING') {
        off.status = 'REJECTED';
      }
    }

    this.save();
    return true;
  }

  // --- Financial Ledger ---
  public saveLedgerEntry(entry: PaymentLedgerEntry) {
    this.data.ledger[entry.id] = entry;
    this.save();
    return entry;
  }
  public getLedger() {
    return Object.values(this.data.ledger);
  }

  // --- Audit Events ---
  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    const entry: AuditEvent = {
      ...event,
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    this.data.auditEvents.push(entry);
    this.save();
    return entry;
  }
  public getAuditEvents() {
    return this.data.auditEvents;
  }

  // --- Complaints ---
  public saveComplaint(complaint: Complaint) {
    this.data.complaints[complaint.id] = complaint;
    this.save();
    return complaint;
  }
  public getAllComplaints() {
    return Object.values(this.data.complaints);
  }

  // --- Zones & Settings ---
  public getZones() {
    return Object.values(this.data.zones);
  }
  public getZone(id: string) {
    return this.data.zones[id];
  }
  public saveZone(zone: CityZone) {
    this.data.zones[zone.id] = zone;
    this.save();
    return zone;
  }
  public getSettings() {
    return this.data.settings;
  }
  public updateSettings(settings: Partial<SystemSettings>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new DatabaseStore();
