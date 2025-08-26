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
