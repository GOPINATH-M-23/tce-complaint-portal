/**
 * Converts raw Firebase Auth & Firestore error codes into friendly, user-facing messages.
 * Logs diagnostics safely to console for debugging without exposing credentials.
 */
export const friendlyAuthError = (err) => {
  const code = err?.code || ''
  const message = err?.message || ''

  console.error('[Firebase Diagnostic Log]', {
    code,
    message,
    name: err?.name,
  })

  const map = {
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/invalid-credential':    'Invalid email or password.',
    'auth/invalid-email':         'Invalid email format.',
    'auth/email-already-in-use':  'This email is already registered. Please sign in instead.',
    'auth/weak-password':         'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests':     'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':'Network error. Check your connection.',
    'auth/popup-closed-by-user':  'Sign-in window was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in cancelled.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/user-disabled':         'This account has been disabled. Contact admin.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/credential-already-in-use': 'These credentials are already linked to another account.',
    'unavailable':                'Database service unavailable. Retrying connection...',
    'permission-denied':          'Permission denied to fetch user profile. Please check account permissions.',
  }
  return map[code] || message || 'Something went wrong. Please try again.'
}

