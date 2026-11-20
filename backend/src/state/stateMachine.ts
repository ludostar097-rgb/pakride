import { RideStatus, UserRole } from '../shared/types.js';
import { db } from '../db/store.js';

// Allowed state transitions mapping
const VALID_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ['OFFERS_OPEN', 'CANCELLED'],
  OFFERS_OPEN: ['DRIVER_SELECTED', 'CANCELLED'],
  DRIVER_SELECTED: ['EN_ROUTE', 'CANCELLED', 'DISPUTED'],
  EN_ROUTE: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED']
};

export class RideStateMachine {
  /**
   * Validate whether a transition is allowed according to the core lifecycle
   */
  public static canTransition(from: RideStatus, to: RideStatus): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Transition ride status, verify actor permissions, and record audit trail
   */
  public static transition(
    rideId: string,
    newStatus: RideStatus,
    actorId: string,
    actorRole: UserRole,
    reason?: string
  ): { success: boolean; error?: string } {
    const ride = db.getRide(rideId);
    if (!ride) {
      return { success: false, error: 'Ride request not found' };
    }

    const currentStatus = ride.status;

    // 1. Validate state transition legality
    if (!this.canTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Illegal state transition from ${currentStatus} to ${newStatus}`
      };
    }

    // 2. Validate actor authority for specific transitions
    if (newStatus === 'EN_ROUTE' || newStatus === 'IN_PROGRESS' || newStatus === 'COMPLETED') {
      if (actorRole !== 'DRIVER' && actorRole !== 'ADMIN') {
        return { success: false, error: 'Only the assigned driver or admin can update trip progress' };
      }
      if (actorRole === 'DRIVER' && ride.driverId !== actorId) {
        return { success: false, error: 'You are not the assigned driver for this ride' };
      }
    }

    if (newStatus === 'CANCELLED') {
      if (currentStatus === 'IN_PROGRESS' && actorRole !== 'ADMIN') {
        return {
          success: false,
          error: 'Ride is already in progress and can only be cancelled by Admin/Support'
        };
      }
      ride.cancellationReason = reason || 'Cancelled by ' + actorRole;
      ride.cancelledBy = actorRole === 'ADMIN' ? 'ADMIN' : (actorRole as any);
    }

    // 3. Apply state update
    ride.status = newStatus;
    ride.updatedAt = new Date().toISOString();
    db.saveRide(ride);

    // 4. Log immutable audit trail
    db.logAudit({
      rideId,
      eventType: 'RIDE_STATUS_TRANSITION',
      actorId,
      actorRole,
      payload: {
        from: currentStatus,
        to: newStatus,
        reason
      }
    });

    return { success: true };
  }
}
