import type {
  Operation,
  TimelineViewport,
  ConflictInfo,
  WorkOrder,
} from "../types";

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
};

export const dateToPixels = (
  date: Date,
  viewport: TimelineViewport
): number => {
  const timeDiff = date.getTime() - viewport.startTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  return hoursDiff * viewport.pixelsPerHour;
};

export const pixelsToDate = (
  pixels: number,
  viewport: TimelineViewport
): Date => {
  const hours = pixels / viewport.pixelsPerHour;
  return new Date(viewport.startTime.getTime() + hours * 60 * 60 * 1000);
};

export const getDuration = (start: string, end: string): number => {
  return new Date(end).getTime() - new Date(start).getTime();
};

export const getDurationHours = (start: string, end: string): number => {
  return (
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60)
  );
};

export const roundToNearestMinutes = (
  date: Date,
  minutes: number = 15
): Date => {
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
          conflicts.push({
            operationId: op1.id,
            conflictWith: [op2.id],
            type: "machine_overlap",
          });
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
        conflicts.push({
          operationId: next.id,
          conflictWith: [current.id],
          type: "sequence_violation",
        });
      }
    }
  });
  return conflicts;
};

const niceStepsMinutes = [15, 30, 60, 120, 180, 240, 360, 720, 1440];

export const chooseTickMinutes = (
  viewport: TimelineViewport,
  minGapPx: number = 90
): number => {
  const pph = viewport.pixelsPerHour;
  for (const m of niceStepsMinutes) {
    const stepPx = (m / 60) * pph;
    if (stepPx >= minGapPx) return m;
  }
  return 1440;
};

export const generateAdaptiveTimeTicks = (
  viewport: TimelineViewport,
  minGapPx: number = 90
): Date[] => {
  const stepMinutes = chooseTickMinutes(viewport, minGapPx);
  const ticks: Date[] = [];
  const start = new Date(viewport.startTime);
  start.setSeconds(0, 0);
  const aligned = new Date(
    Math.ceil(start.getTime() / (stepMinutes * 60 * 1000)) *
      (stepMinutes * 60 * 1000)
  );
  let t = aligned;
  while (t <= viewport.endTime) {
    if (t >= viewport.startTime) ticks.push(new Date(t));
    t = new Date(t.getTime() + stepMinutes * 60 * 1000);
  }
  return ticks;
};

export const validateDragPosition = (
  operation: Operation,
  newStartTime: Date,
  workOrders: WorkOrder[],
  allOperations: Operation[]
): { isValid: boolean; constrainedPosition?: Date; reason?: string } => {
  const now = new Date();
  const duration = getDurationHours(operation.start, operation.end);

  if (newStartTime < now) {
    return {
      isValid: false,
      constrainedPosition: now,
      reason: "Cannot schedule in the past",
    };
  }

  const workOrder = workOrders.find((wo) => wo.id === operation.workOrderId);
  if (!workOrder) {
    return { isValid: true };
  }

  const prevOp = workOrder.operations.find(
    (op) => op.index === operation.index - 1
  );
  if (prevOp && newStartTime < new Date(prevOp.end)) {
    const constrainedStart = new Date(prevOp.end);
    return {
      isValid: false,
      constrainedPosition: constrainedStart,
      reason: `Must start after ${prevOp.name} ends`,
    };
  }

  const nextOp = workOrder.operations.find(
    (op) => op.index === operation.index + 1
  );
  if (nextOp) {
    const maxAllowedStart = new Date(
      new Date(nextOp.start).getTime() - duration * 3600000
    );
    if (newStartTime > maxAllowedStart) {
      return {
        isValid: false,
        constrainedPosition: maxAllowedStart,
        reason: `Must end before ${nextOp.name} starts`,
      };
    }
  }

  const machineOps = allOperations.filter(
    (op) => op.machineId === operation.machineId && op.id !== operation.id
  );

  const validPosition = findValidMachineSlot(
    newStartTime,
    duration,
    machineOps,
    prevOp ? new Date(prevOp.end) : now,
    nextOp
      ? new Date(new Date(nextOp.start).getTime() - duration * 3600000)
      : new Date(Date.now() + 365 * 24 * 3600000)
  );

  if (validPosition.getTime() !== newStartTime.getTime()) {
    return {
      isValid: false,
      constrainedPosition: validPosition,
      reason: "Machine conflict detected",
    };
  }

  return { isValid: true };
};

const findValidMachineSlot = (
  preferredStart: Date,
  durationHours: number,
  machineOps: Operation[],
  earliestStart: Date,
  latestStart: Date
): Date => {
  const durationMs = durationHours * 3600000;
  const sortedOps = machineOps.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const preferredEnd = new Date(preferredStart.getTime() + durationMs);
  let hasConflict = false;

  for (const op of sortedOps) {
    if (
      timeRangesOverlap(
        preferredStart.toISOString(),
        preferredEnd.toISOString(),
        op.start,
        op.end
      )
    ) {
      hasConflict = true;
      break;
    }
  }

  if (
    !hasConflict &&
    preferredStart >= earliestStart &&
    preferredStart <= latestStart
  ) {
    return preferredStart;
  }

  let searchStart = new Date(
    Math.max(earliestStart.getTime(), preferredStart.getTime())
  );

  for (const op of sortedOps) {
    const opStart = new Date(op.start);
    const opEnd = new Date(op.end);

    const slotEnd = new Date(searchStart.getTime() + durationMs);
    if (slotEnd <= opStart && searchStart <= latestStart) {
      return searchStart;
    }

    if (searchStart < opEnd) {
      searchStart = new Date(opEnd.getTime());
    }
  }

  if (searchStart <= latestStart) {
    return searchStart;
  }

  searchStart = new Date(
    Math.max(earliestStart.getTime(), preferredStart.getTime())
  );

  for (let i = sortedOps.length - 1; i >= 0; i--) {
    const op = sortedOps[i];
    const opStart = new Date(op.start);
    const candidateStart = new Date(opStart.getTime() - durationMs);

    if (candidateStart >= earliestStart) {
      let canFit = true;
      const candidateEnd = new Date(candidateStart.getTime() + durationMs);

      for (const otherOp of sortedOps) {
        if (otherOp.id === op.id) continue;
        if (
          timeRangesOverlap(
            candidateStart.toISOString(),
            candidateEnd.toISOString(),
            otherOp.start,
            otherOp.end
          )
        ) {
          canFit = false;
          break;
        }
      }

      if (canFit) {
        return candidateStart;
      }
    }
  }

  return earliestStart;
};

export const getConstrainedDragPosition = (
  operation: Operation,
  mousePixelX: number,
  viewport: TimelineViewport,
  workOrders: WorkOrder[],
  allOperations: Operation[]
): number => {
  const tentativeStart = pixelsToDate(mousePixelX, viewport);
  const validation = validateDragPosition(
    operation,
    tentativeStart,
    workOrders,
    allOperations
  );

  if (validation.isValid) {
    return mousePixelX;
  }

  if (validation.constrainedPosition) {
    return dateToPixels(validation.constrainedPosition, viewport);
  }

  return dateToPixels(new Date(operation.start), viewport);
};
