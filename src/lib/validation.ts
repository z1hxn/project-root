import { z } from 'zod';
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9_]{2,19}$/,
    '영문 소문자로 시작하는 3–20자의 영문, 숫자, 밑줄을 사용해 주세요.',
  );
export const registrationSchema = z
  .object({
    username,
    email: z.string().trim().toLowerCase().email('올바른 이메일 주소를 입력해 주세요.').max(254),
    password: z
      .string()
      .min(10, '비밀번호를 10자 이상 입력해 주세요.')
      .max(128, '비밀번호는 128자 이하여야 합니다.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
  });
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(128),
});
export const profileSchema = z.object({
  displayName: z.string().trim().min(1, '표시 이름을 입력해 주세요.').max(32).optional(),
  wallpaper: z.enum(['slate', 'midnight']).optional(),
  briefingCompleted: z.literal(true).optional(),
  setupCompleted: z.literal(true).optional(),
});
