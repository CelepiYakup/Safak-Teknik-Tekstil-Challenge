import type { Operation, TimelineViewport, ConflictInfo } from "../types";

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
};

export const dateToPixels = (date: Date, viewport: TimelineViewport): number => {
  const timeDiff = date.getTime() - viewport.startTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  return hoursDiff * viewport.pixelsPerHour;
};

export const pixelsToDate = (pixels: number, viewport: TimelineViewport): Date => {
  const hours = pixels / viewport.pixelsPerHour;
  return new Date(viewport.startTime.getTime() + hours * 60 * 60 * 1000);
};

export const getDuration = (start: string, end: string): number => {
  return new Date(end).getTime() - new Date(start).getTime();
};

export const getDurationHours = (start: string, end: string): number => {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
};

export const roundToNearestMinutes = (date: Date, minutes: number = 15): Date => {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    (groups[group] = groups[group] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && s2 < e1;
};

export const detectConflicts = (operations: Operation[]): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = [];
  const machineGroups = groupBy(operations, "machineId");
  Object.entries(machineGroups).forEach(([, ops]) => {
    for (let i = 0; i < ops.length; i++) {
      for (let j = i + 1; j < ops.length; j++) {
        const op1 = ops[i];
        const op2 = ops[j];
        if (timeRangesOverlap(op1.start, op1.end, op2.start, op2.end)) {
          conflicts.push({ operationId: op1.id, conflictWith: [op2.id], type: "machine_overlap" });
        }
      }
    }
  });
  const workOrderGroups = groupBy(operations, "workOrderId");
  Object.values(workOrderGroups).forEach((ops) => {
    const sorted = ops.slice().sort((a, b) => a.index - b.index);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (new Date(next.start) < new Date(current.end)) {
        conflicts.push({ operationId: next.id, conflictWith: [current.id], type: "sequence_violation" });
      }
    }
  });
  return conflicts;
};

const niceStepsMinutes = [15, 30, 60, 120, 180, 240, 360, 720, 1440];

export const chooseTickMinutes = (viewport: TimelineViewport, minGapPx: number = 90): number => {
  const pph = viewport.pixelsPerHour;
  for (const m of niceStepsMinutes) {
    const stepPx = (m / 60) * pph;
    if (stepPx >= minGapPx) return m;
  }
  return 1440;
};

export const generateAdaptiveTimeTicks = (viewport: TimelineViewport, minGapPx: number = 90): Date[] => {
  const stepMinutes = chooseTickMinutes(viewport, minGapPx);
  const ticks: Date[] = [];
  const start = new Date(viewport.startTime);
  start.setSeconds(0, 0);
  const aligned = new Date(Math.ceil(start.getTime() / (stepMinutes * 60 * 1000)) * (stepMinutes * 60 * 1000));
  let t = aligned;
  while (t <= viewport.endTime) {
    if (t >= viewport.startTime) ticks.push(new Date(t));
    t = new Date(t.getTime() + stepMinutes * 60 * 1000);
  }
  return ticks;
};
