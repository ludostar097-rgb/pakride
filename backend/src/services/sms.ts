// ==========================================
// PakRide SMS & Verification Service Interface
// ==========================================

export interface ISmsService {
  sendOtp(phone: string, otp: string): Promise<boolean>;
}

export class ConsoleSmsService implements ISmsService {
  public async sendOtp(phone: string, otp: string): Promise<boolean> {
    // In development and test environments, log clearly to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS-SERVICE] 📱 Sent 6-digit OTP to ${phone}: ${otp}`);
    }
    // Real SMS gateway (Twilio, Telenor, Zong, Jazz) integration will plug in here for production
    return true;
  }
}

export const smsService: ISmsService = new ConsoleSmsService();
