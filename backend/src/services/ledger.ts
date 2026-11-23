import { PaymentLedgerEntry, PaymentMethod, PaymentStatus, RideRequest } from '../shared/types.js';
import { db } from '../db/store.js';

export class LedgerService {
  /**
   * Record a financial transaction for a completed ride.
   * Uses Integer Minor Units (paisa).
   */
  public static recordRidePayment(
    ride: RideRequest,
    method: PaymentMethod = 'CASH'
  ): PaymentLedgerEntry {
    const grossAmountPaisa = ride.agreedFarePaisa || ride.proposedFarePaisa;
    const settings = db.getSettings();
    const commissionPercent = settings.introductoryCommissionPercent; // 0% at launch

    // Platform commission in paisa (0% at launch)
    const platformCommissionPaisa = Math.round((grossAmountPaisa * commissionPercent) / 100);
    const driverNetPaisa = grossAmountPaisa - platformCommissionPaisa;

    const entry: PaymentLedgerEntry = {
      id: 'ledg-' + Math.random().toString(36).substring(2, 9),
      rideId: ride.id,
      cityId: ride.cityId || 'city-karachi',
      driverId: ride.driverId || 'unassigned',
      passengerId: ride.passengerId,
      method,
      grossAmountPaisa,
      platformCommissionPaisa,
      driverNetPaisa,
      status: 'PAID',
      reconciledAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    db.saveLedgerEntry(entry);

    // Update ride payment status
    ride.paymentStatus = 'PAID';
    ride.paymentMethod = method;
    db.saveRide(ride);

    db.logAudit({
      rideId: ride.id,
      eventType: 'PAYMENT_RECORDED',
      actorId: ride.driverId || 'SYSTEM',
      actorRole: 'SYSTEM',
      payload: {
        ledgerId: entry.id,
        grossPaisa: grossAmountPaisa,
        commissionPaisa: platformCommissionPaisa,
        driverNetPaisa
      }
    });

    return entry;
  }

  /**
   * JazzCash & Easypaisa Merchant Callback Adapter (Sandbox / Future Gate)
   */
  public static processDigitalCallback(
    provider: 'JAZZCASH' | 'EASYPAISA',
    payload: {
      pp_TxnRefNo: string;
      pp_Amount: string; // amount in PKR or Paisa
      pp_ResponseCode: string;
      pp_SecureHash?: string;
      rideId: string;
    }
  ): { success: boolean; message: string } {
    // Idempotency check: Ensure callback isn't processed twice
    const existing = db.getLedger().find((l) => l.rideId === payload.rideId && l.status === 'PAID');
    if (existing) {
      return { success: true, message: 'Transaction already settled (idempotent)' };
    }

    const ride = db.getRide(payload.rideId);
    if (!ride) {
      return { success: false, message: 'Ride not found' };
    }

    if (payload.pp_ResponseCode === '000' || payload.pp_ResponseCode === '0000') {
      this.recordRidePayment(ride, provider);
      return { success: true, message: 'Digital payment settled successfully' };
    } else {
      ride.paymentStatus = 'FAILED';
      db.saveRide(ride);
      return { success: false, message: 'Provider rejected transaction' };
    }
  }
}
