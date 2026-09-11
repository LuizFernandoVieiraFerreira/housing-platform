export function getInitials(fullName?: string | null, email?: string | null): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }

    return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
  }

  return email?.slice(0, 2).toUpperCase() ?? '?';
}
