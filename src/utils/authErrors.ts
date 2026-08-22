/**
 * authErrors.ts — Supabase errors ko friendly messages mein convert karta hai
 * 
 * KYUN zaruri hai:
 * - Supabase ke errors technical hote hain (e.g. "rate_limit_exceeded")
 * - Users ko samajh nahi aata ye kya hai
 * - Hum isko friendly message mein badalte hain (e.g. "Too many attempts...")
 * 
 * KAISE kaam karta hai:
 * - Supabase error code check karo
 * - Us code ka friendly message return karo
 * - Agar code match na ho toh default message do
 */

interface AuthError {
  message: string;
  status?: number;
}

// Friendly messages — ye user ko dikhega
const ERROR_MESSAGES: Record<string, string> = {
  // Rate limit — zyada baar try kiya
  rate_limit_exceeded: 'Too many attempts. Please try again in a few minutes.',
  
  // Galat email ya password
  invalid_credentials: 'Email or password is incorrect. Please try again.',
  
  // Email verify nahi hua
  email_not_confirmed: 'Please verify your email address first. Check your inbox.',
  
  // User already exist karta hai
  user_already_registered: 'An account with this email already exists. Please sign in instead.',
  
  // Password kamzor hai
  weak_password: 'Password is too weak. Use at least 8 characters with 1 uppercase and 1 number.',
  
  // Email format galat hai
  invalid_email: 'Please enter a valid email address.',
  
  // Email nahi mila
  user_not_found: 'No account found with this email. Please sign up first.',
  
  // Password reset limit
  email_rate_limit: 'Too many password reset attempts. Please try again later.',
  
  // Signup temporarily disabled
  signup_disabled: 'Sign up is temporarily disabled. Please try again later.',
};

/**
 * Supabase error ko friendly message mein convert karo
 * 
 * @param error - Supabase ka error object
 * @returns Friendly message string
 * 
 * Example usage:
 * const { error } = await signIn(email, password);
 * if (error) {
 *   Alert.alert('Login Failed', getAuthErrorMessage(error));
 * }
 */
export const getAuthErrorMessage = (error: AuthError | null): string => {
  // Agar error hi nahi hai toh default message
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Check karo — error message mein koi known pattern hai?
  
  // Rate limit check
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please try again in a few minutes.';
  }

  // Invalid credentials check
  if (message.includes('invalid login') || message.includes('invalid grant')) {
    return 'Email or password is incorrect. Please try again.';
  }

  // Email not confirmed check
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please verify your email address first. Check your inbox.';
  }

  // User already exists check
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // Weak password check
  if (message.includes('weak password') || message.includes('at least 6 characters')) {
    return 'Password is too weak. Use at least 8 characters.';
  }

  // Invalid email check
  if (message.includes('invalid email') || message.includes('valid email')) {
    return 'Please enter a valid email address.';
  }

  // User not found check
  if (message.includes('user not found') || message.includes('user not found')) {
    return 'No account found with this email. Please sign up first.';
  }

  // Signup disabled check
  if (message.includes('signup disabled') || message.includes('signups not allowed')) {
    return 'Sign up is temporarily disabled. Please try again later.';
  }

  // Agar koi match na ho — original message return karo (short form)
  // Users ko technical details mat dikhao
  return 'Something went wrong. Please try again.';
};

/**
 * Error type detect karo — specific handling ke liye
 * 
 * Example:
 * const errorType = getAuthErrorType(error);
 * if (errorType === 'rate_limit') {
 *   // 5 minute ka timer dikhao
 * }
 */
export type AuthErrorType = 
  | 'rate_limit' 
  | 'invalid_credentials' 
  | 'email_not_confirmed' 
  | 'user_exists' 
  | 'weak_password' 
  | 'unknown';

export const getAuthErrorType = (error: AuthError | null): AuthErrorType => {
  if (!error) return 'unknown';

  const message = error.message.toLowerCase();

  if (message.includes('rate limit') || message.includes('too many')) return 'rate_limit';
  if (message.includes('invalid login') || message.includes('invalid grant')) return 'invalid_credentials';
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) return 'email_not_confirmed';
  if (message.includes('already registered') || message.includes('already been registered')) return 'user_exists';
  if (message.includes('weak password') || message.includes('at least 6 characters')) return 'weak_password';

  return 'unknown';
};
