import { VehicleCategory, CityZone } from '../shared/types.js';
import { db } from '../db/store.js';

export class PricingService {
  /**
   * Automatically detect matching operational zone from GPS coordinates
   */
  public static findMatchingZone(lat: number, lng: number): CityZone | null {
    const zones = db.getZones();
    // 1. Find active zone containing coordinates within radius
    for (const zone of zones) {
      if (!zone.isActive) continue;
      const dist = this.calculateDistanceKm(lat, lng, zone.centerLat, zone.centerLng);
      if (dist <= zone.radiusKm) {
        return zone;
      }
    }
    // 2. Fallback: find nearest active zone in Pakistan
    let nearest: CityZone | null = null;
    let minDist = Infinity;
    for (const zone of zones) {
      if (!zone.isActive) continue;
      const dist = this.calculateDistanceKm(lat, lng, zone.centerLat, zone.centerLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = zone;
      }
    }
    return nearest;
  }

  /**
   * Calculate suggested fare in integer minor units (PKR paisa)
   * Formula: baseFare + (perKmRate * distanceKm)
   */
  public static calculateSuggestedFarePaisa(
    category: VehicleCategory,
    distanceKm: number,
    zoneId: string = 'zone-karachi-jauhar'
  ): number {
    const zone = db.getZone(zoneId);

    let basePaisa = 10000; // 100 PKR fallback
    let perKmPaisa = 3000;  // 30 PKR / km fallback

    if (zone) {
      if (category === 'CAR') {
        basePaisa = zone.baseFareCarPaisa;
        perKmPaisa = zone.perKmCarPaisa;
      } else if (category === 'MOTORCYCLE') {
        basePaisa = zone.baseFareMotoPaisa;
        perKmPaisa = zone.perKmMotoPaisa;
      } else if (category === 'RICKSHAW') {
        basePaisa = zone.baseFareRickshawPaisa;
        perKmPaisa = zone.perKmRickshawPaisa;
      }
    }

    const calculated = basePaisa + Math.round(perKmPaisa * Math.max(distanceKm, 1));
    // Round to nearest 500 paisa (5 PKR) for clean denomination
    return Math.round(calculated / 500) * 500;
  }

  /**
   * Haversine distance in KM between two geographic points
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;
    // Apply road winding factor in urban Karachi (approx 1.35x straight line)
    const urbanRoadDistance = Math.round(straightDist * 1.35 * 10) / 10;
    return Math.max(urbanRoadDistance, 0.8);
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
