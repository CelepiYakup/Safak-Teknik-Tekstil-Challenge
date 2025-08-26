export type Operation = {
  id: string;
  workOrderId: string;
  index: number;
  machineId: string;
  name: string;
  start: string;
  end: string;
};

export type WorkOrder = {
  id: string;
  product: string;
  qty: number;
  operations: Operation[];
};

export type TimelineViewport = {
  startTime: Date;
  endTime: Date;
  pixelsPerHour: number;
  viewportWidth: number;
};

export type DragState = {
  operation: Operation;
  initialX: number;
  offsetX: number;
  dragStartTime: Date;
};

export type ConflictInfo = {
  operationId: string;
  conflictWith: string[];
  type: "machine_overlap" | "sequence_violation";
};
