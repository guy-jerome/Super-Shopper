import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const storeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const aisleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  side: z.enum(['left', 'right', 'center']).optional(),
});

export const authSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
