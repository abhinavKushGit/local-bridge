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
