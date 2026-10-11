async function sha256(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.buffer));
}

export async function isValidBearerCredential(
  authorizationHeader: string | null,
  expectedSecret: string,
): Promise<boolean> {
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const suppliedSecret = authorizationHeader.slice(7);
  if (!suppliedSecret) return false;

  const [suppliedDigest, expectedDigest] = await Promise.all([
    sha256(suppliedSecret),
    sha256(expectedSecret),
  ]);

  let difference = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= suppliedDigest[index] ^ expectedDigest[index];
  }
  return difference === 0;
}
