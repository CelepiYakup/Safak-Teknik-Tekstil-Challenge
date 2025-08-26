import { create } from "zustand";
import type { WorkOrder } from "../types";
import { getWorkOrders, patchOperation } from "../api";

type ToastState = {
  message: string;
  type: "success" | "error" | "warning" | "info";
} | null;

type State = {
  workOrders: WorkOrder[];
  loading: boolean;
  toast: ToastState;
  highlightedWorkOrderId: string | null;
  lastUpdated: Date | null;
  fetchAll: () => Promise<void>;
  updateOperation: (opId: string, start: string, end: string) => Promise<void>;
  setHighlight: (workOrderId: string | null) => void;
  showToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  clearToast: () => void;
};

export const useScheduleStore = create<State>()((set, get) => ({
  workOrders: [],
  loading: false,
  toast: null,
  highlightedWorkOrderId: null,
  lastUpdated: null,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const data = await getWorkOrders();
      set({
        workOrders: data,
        lastUpdated: new Date(),
        loading: false,
      });
    } catch (error: any) {
      get().showToast(
        error.response?.data?.message || "Failed to load work orders",
        "error"
      );
      set({ loading: false });
    }
  },

  updateOperation: async (opId, start, end) => {
    const originalWorkOrders = get().workOrders;
    set((state) => ({
      workOrders: state.workOrders.map((wo) => ({
        ...wo,
        operations: wo.operations.map((op) =>
          op.id === opId ? { ...op, start, end } : op
        ),
      })),
    }));
    try {
      await patchOperation(opId, { start, end });
      get().showToast("Operation updated successfully", "success");
      set({ lastUpdated: new Date() });
    } catch (error: any) {
      set({ workOrders: originalWorkOrders });
      const message =
        error.response?.data?.message || "Failed to update operation";
      get().showToast(message, "error");
      throw error;
    }
  },

  setHighlight: (workOrderId) => {
    set({ highlightedWorkOrderId: workOrderId });
  },

  showToast: (message, type) => {
    set({ toast: { message, type } });
  },

  clearToast: () => {
    set({ toast: null });
  },
}));
