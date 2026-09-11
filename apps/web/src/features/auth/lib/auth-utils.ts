export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

export function getSafeReturnTo(value: string | null, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

/** Home path for an already-authenticated user based on their profile role. */
export function getAuthenticatedHomePath(role: string | undefined, fallback = '/'): string {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'host') {
    return '/host';
  }

  return fallback;
}

/** Where to send the user after a successful login. Honors an explicit returnTo when present. */
export function resolvePostLoginPath(options: {
  returnToParam: string | null;
  defaultRedirectTo: string;
  role: string | undefined;
}): string {
  const { returnToParam, defaultRedirectTo, role } = options;

  if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//')) {
    return getSafeReturnTo(returnToParam, defaultRedirectTo);
  }

  return getAuthenticatedHomePath(role, defaultRedirectTo);
}
