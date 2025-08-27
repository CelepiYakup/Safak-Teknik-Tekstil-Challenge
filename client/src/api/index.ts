import axios from "axios";
import type { WorkOrder, Operation } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export default api;

export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  const { data } = await api.get("/work-orders");
  return data;
};

export const patchOperation = async (
  id: string,
  payload: { start: string; end: string }
): Promise<Operation> => {
  const { data } = await api.patch(`/operations/${id}`, payload);
  return data;
};

export const validateOperationMove = async (
  id: string,
  payload: { start: string; end: string }
): Promise<{ valid: boolean; message: string; details?: any; suggestion?: { start: string; end: string } }> => {
  try {
    const { data } = await api.post(`/operations/${id}/validate`, payload);
    return data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      return error.response.data;
    }
    throw error;
  }
};

export const getOperationConstraints = async (id: string) => {
  const { data } = await api.get(`/operations/${id}/constraints`);
  return data;
};

export const getValidTimeSlots = async (
  id: string,
  start: string,
  duration: number
): Promise<{ validSlot: { start: string; end: string } | null; message?: string }> => {
  try {
    const { data } = await api.get(`/operations/${id}/valid-slots`, {
      params: { start, duration: duration.toString() }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return error.response.data;
    }
    throw error;
  }
};