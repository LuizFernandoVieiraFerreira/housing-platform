function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim();

  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid Channel secret format');
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

export async function createMemberHash(memberId: string, secretKeyHex: string): Promise<string> {
  const keyBytes = hexToBytes(secretKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(memberId));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
