'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

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

  // Check if user already exists
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return { error: 'An account with this email already exists.' };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUserDocRef = await addDoc(usersRef, {
      name,
      email,
      password: hashedPassword,
      image: null, // No image for email signup, user can add later
      createdAt: serverTimestamp(),
    });

    // Update the document with its own ID for consistency with Google provider
    await updateDoc(newUserDocRef, {
      id: newUserDocRef.id
    });

    return { success: 'User registered successfully!' };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: 'Could not create account. Please try again.' };
  }
}
