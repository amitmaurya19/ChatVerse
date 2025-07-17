// This file does NOT start with 'use server';
export function getAvatarFallback(name: string): string {
  if (!name) {
    return 'NA'; 
  }
  const words = name.split(' ').filter(Boolean); 

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  } else if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase(); 
}