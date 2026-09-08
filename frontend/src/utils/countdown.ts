export interface SubscriptionCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // <= 7 days
  formatted: string;
  percentageRemaining: number;
  statusLabel: 'HEALTHY' | 'EXPIRING_SOON' | 'EXPIRED';
}

export function getSubscriptionCountdown(
  endDateStr?: string | Date | null,
  startDateStr?: string | Date | null
): SubscriptionCountdown {
  if (!endDateStr) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isExpiringSoon: true,
      formatted: 'No Active Cycle',
      percentageRemaining: 0,
      statusLabel: 'EXPIRED',
    };
  }

  const end = new Date(endDateStr).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isExpiringSoon: true,
      formatted: 'Subscription Expired',
      percentageRemaining: 0,
      statusLabel: 'EXPIRED',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Total duration calculation
  const start = startDateStr ? new Date(startDateStr).getTime() : end - 30 * 24 * 60 * 60 * 1000;
  const totalCycle = Math.max(1, end - start);
  const percentageRemaining = Math.max(0, Math.min(100, Math.round((diff / totalCycle) * 100)));

  const formatted =
    days > 0 ? `${days}d ${hours}h left` : hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m ${seconds}s left`;

  const isExpiringSoon = days <= 7;
  const statusLabel = isExpiringSoon ? 'EXPIRING_SOON' : 'HEALTHY';

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isExpired: false,
    isExpiringSoon,
    formatted,
    percentageRemaining,
    statusLabel,
  };
}
