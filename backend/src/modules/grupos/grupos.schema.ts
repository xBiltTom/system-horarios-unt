import { z } from 'zod';

export const crearGrupoSchema = z.object({
  id_componente: z.number().int().positive(),
  codigo: z.string().min(1).max(10),
  capacidad_maxima: z.number().int().min(1).default(40),
});

export const actualizarGrupoSchema = z.object({
  codigo: z.string().min(1).max(10).optional(),
  capacidad_maxima: z.number().int().min(1).optional(),
});

export const crearGruposMasivoSchema = z.object({
  cantidad: z.number().int().min(1),
  capacidad_maxima: z.number().int().min(1).optional(),
});
