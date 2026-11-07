/**
 * Time utility functions for work sessions, overlap detection, and midnight splitting
 */
import { WorkLog } from '../types';

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatSecondsToDecimalHours(seconds: number): string {
  return (seconds / 3600).toFixed(1);
}

export function calculateLogDurationSeconds(log: WorkLog): number {
  const start = new Date(log.start).getTime();
  const end = new Date(log.end).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return Math.floor((end - start) / 1000);
}

export function checkOverlap(
  newStart: string,
  newEnd: string,
  existingLogs: WorkLog[],
  ignoreId?: string
): boolean {
  const sStart = new Date(newStart).getTime();
  const sEnd = new Date(newEnd).getTime();
  if (isNaN(sStart) || isNaN(sEnd) || sEnd <= sStart) return false;

  for (const log of existingLogs) {
    if (ignoreId && log.id === ignoreId) continue;
    const lStart = new Date(log.start).getTime();
    const lEnd = new Date(log.end).getTime();
    if (isNaN(lStart) || isNaN(lEnd)) continue;

    // Overlap condition: startA < endB and startB < endA
    if (sStart < lEnd && lStart < sEnd) {
      return true;
    }
  }
  return false;
}

/**
 * Split a session if it spans across midnight into daily logs
 */
export function splitLogAcrossMidnight(log: WorkLog): WorkLog[] {
  const startDate = new Date(log.start);
  const endDate = new Date(log.end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return [log];
  }

  const startDayStr = startDate.toISOString().split('T')[0];
  const endDayStr = endDate.toISOString().split('T')[0];

  if (startDayStr === endDayStr) {
    return [log];
  }

  // Spans multiple days, split at midnight boundaries
  const logs: WorkLog[] = [];
  let currentStart = startDate;

  while (true) {
    const currentDayStr = currentStart.toISOString().split('T')[0];
    const nextMidnight = new Date(`${currentDayStr}T23:59:59.999Z`);
    // Actually next day 00:00:00
    const nextDay = new Date(currentStart);
    nextDay.setUTCHours(24, 0, 0, 0);

    if (endDate <= nextDay) {
      logs.push({
        ...log,
        id: `${log.id}-${currentDayStr}`,
        start: currentStart.toISOString(),
        end: endDate.toISOString()
      });
      break;
    } else {
      logs.push({
        ...log,
        id: `${log.id}-${currentDayStr}`,
        start: currentStart.toISOString(),
        end: nextDay.toISOString()
      });
      currentStart = nextDay;
    }
  }

  return logs;
}
