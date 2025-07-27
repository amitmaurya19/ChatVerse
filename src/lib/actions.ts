'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from './data';

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function registerUser(values: z.infer<typeof RegisterSchema>): Promise<{ success?: string; error?: string }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields provided.' };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: 'An account with this email already exists.' };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await createUser({
      name,
      email,
      password: hashedPassword,
      image: '', 
    });

    return { success: 'User registered successfully!' };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: 'Could not create account. Please try again.' };
  }
}
