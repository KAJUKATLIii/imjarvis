import prisma from '../../config/prisma';

export interface AntiFraudAssessment {
  isValid: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number; // 0 to 100
  detectedBank: string;
  flags: string[];
  isDuplicate: boolean;
  isDummy: boolean;
  julianDay?: number;
  hour?: number;
  yearDigit?: number;
}

export const antiFraudService = {
  /**
   * Evaluates a 12-digit UPI UTR / RRN for fraud, duplication, and Indian banking syntax patterns.
   */
  async assessUTR(utr: string, currentOrderId?: string): Promise<AntiFraudAssessment> {
    const flags: string[] = [];
    let riskScore = 0;
    let isDummy = false;
    let isDuplicate = false;

    const trimmed = (utr || '').trim();

    // 1. Basic format check
    if (!/^\d{12}$/.test(trimmed)) {
      return {
        isValid: false,
        riskLevel: 'HIGH',
        riskScore: 100,
        detectedBank: 'INVALID',
        flags: ['UTR must be exactly 12 numeric digits'],
        isDuplicate: false,
        isDummy: true,
      };
    }

    // 2. Repetitive digit check (e.g. 000000000000, 111111111111, 999999999999)
    if (/^(\d)\1{11}$/.test(trimmed)) {
      flags.push('Repetitive dummy digits detected (e.g. 111111111111)');
      riskScore += 90;
      isDummy = true;
    }

    // 3. Sequential digit check (e.g. 123456789012, 987654321098, 012345678901)
    const sequentialAscending = '0123456789012345';
    const sequentialDescending = '9876543210987654';
    if (sequentialAscending.includes(trimmed) || sequentialDescending.includes(trimmed)) {
      flags.push('Sequential ascending/descending test digits (e.g. 123456789012)');
      riskScore += 95;
      isDummy = true;
    }

    // 4. Repeated short pattern check (e.g. 121212121212, 123123123123, 123412341234)
    if (
      trimmed === trimmed.slice(0, 2).repeat(6) ||
      trimmed === trimmed.slice(0, 3).repeat(4) ||
      trimmed === trimmed.slice(0, 4).repeat(3)
    ) {
      flags.push('Repeated cycle pattern detected');
      riskScore += 85;
      isDummy = true;
    }

    // 5. Database Duplicate & Recycled UTR check
    const existingPayment = await prisma.payment.findUnique({
      where: { utr: trimmed },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        user: { select: { username: true, discordId: true } },
      },
    });

    if (existingPayment) {
      // If it's already used on a different order, this is a critical fraud flag
      if (!currentOrderId || existingPayment.orderId !== currentOrderId) {
        flags.push(
          `RECYCLED UTR: Already approved/submitted on Order ${existingPayment.order?.orderNumber || existingPayment.orderId} by ${existingPayment.user?.username || 'another user'}`
        );
        riskScore = 100;
        isDuplicate = true;
      }
    }

    // 6. Indian NPCI RRN (Retrieval Reference Number) Syntax Validation
    // Standard NPCI structure:
    // Digit 0: Last digit of current year (e.g. 6 for 2026, 5 for 2025)
    // Digits 1-3: Day of Year (Julian Day 001 - 366)
    // Digits 4-5: Hour of the day (00 - 23)
    // Digits 6-11: Transaction sequence sequence counter
    const yearDigit = parseInt(trimmed[0], 10);
    const julianDay = parseInt(trimmed.slice(1, 4), 10);
    const hour = parseInt(trimmed.slice(4, 6), 10);

    const currentYear = new Date().getFullYear();
    const expectedYearDigit = currentYear % 10; // e.g. 6 for 2026

    let detectedBank = 'NPCI Core Gateway';

    // Verify Year Digit
    if (yearDigit !== expectedYearDigit && yearDigit !== (expectedYearDigit - 1 + 10) % 10) {
      flags.push(`Year code '${yearDigit}' does not match current year ${currentYear} (expected ${expectedYearDigit})`);
      riskScore += 25;
    }

    // Verify Julian Day
    if (julianDay < 1 || julianDay > 366) {
      flags.push(`Invalid Julian day '${julianDay}' (must be 001 - 366)`);
      riskScore += 45;
    }

    // Verify Hour
    if (hour > 23) {
      flags.push(`Invalid hour '${hour}' (must be 00 - 23)`);
      riskScore += 20;
    }

    // Heuristic Bank Channel Identification based on NPCI BIN / Routing prefix
    const firstTwo = trimmed.slice(0, 2);
    if (['60', '61', '62'].includes(firstTwo)) {
      detectedBank = 'SBI / State Bank Group (NPCI)';
    } else if (['63', '64'].includes(firstTwo)) {
      detectedBank = 'HDFC Bank Direct UPI';
    } else if (['65', '66'].includes(firstTwo)) {
      detectedBank = 'ICICI Bank iMobile Gateway';
    } else if (['67', '68'].includes(firstTwo)) {
      detectedBank = 'Axis Bank UPI Gateway';
    } else if (['69'].includes(firstTwo)) {
      detectedBank = 'PhonePe / YES Bank Merchant';
    } else if (['40', '41', '42', '50', '51', '52'].includes(firstTwo)) {
      detectedBank = 'Google Pay / NPCI Partner Bank';
    } else {
      detectedBank = 'Indian Scheduled Bank (UPI)';
    }

    // 7. Calculate Final Risk Level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (riskScore >= 60 || isDuplicate || isDummy) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 20) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      isValid: riskScore < 60 && !isDuplicate && !isDummy,
      riskLevel,
      riskScore: Math.min(100, riskScore),
      detectedBank,
      flags,
      isDuplicate,
      isDummy,
      yearDigit,
      julianDay,
      hour,
    };
  },
};
