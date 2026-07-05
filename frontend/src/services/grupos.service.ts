import { apiClient } from '@/lib/api-client';

export const gruposService = {
  listar: (params?: any) => apiClient.get('/grupos', { params }),
  obtener: (id: number) => apiClient.get(`/grupos/${id}`),
  crear: (datos: any) => apiClient.post('/grupos', datos),
  crearPorComponente: (componenteId: number, datos: any) => apiClient.post(`/grupos/por-componente/${componenteId}`, datos),
  actualizar: (id: number, datos: any) => apiClient.put(`/grupos/${id}`, datos),
  eliminar: (id: number) => apiClient.delete(`/grupos/${id}`),
  listarPorComponente: (componenteId: number) => apiClient.get(`/grupos/por-componente/${componenteId}`),
};
