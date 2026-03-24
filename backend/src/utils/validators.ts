import { z } from 'zod';

export const sendOTPSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^\+?[0-9]+$/, 'Invalid phone number format'),
});

export const verifyOTPSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
  home_address: z.string().max(200).optional(),
  radius_meters: z.number().min(500).max(10000).optional(),
  sms_opt_in: z.boolean().optional(),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const createPostSchema = z.object({
  mode: z.enum(['need', 'offer', 'sell', 'volunteer', 'alert', 'request']),
  title: z.string().min(3, 'Title too short').max(150, 'Title too long'),
  description: z.string().min(10, 'Description too short').max(2000),
  category_id: z.string().uuid().optional(),
  urgency: z.enum(['low', 'medium', 'high']).default('low'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address_hint: z.string().max(200).optional(),
  price: z.number().min(0).optional(),
  expires_at: z.string().datetime().optional(),
});

export const feedQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(500).max(10000).default(2000),
  mode: z.enum(['need', 'offer', 'sell', 'volunteer', 'alert', 'request']).optional(),
  category_id: z.string().uuid().optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
