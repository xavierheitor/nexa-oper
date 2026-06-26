const SENSITIVE_KEY_PATTERNS = [
  /SECRET/i,
  /PASSWORD/i,
  /PASSWD/i,
  /TOKEN/i,
  /PRIVATE_KEY/i,
  /ACCESS_KEY/i,
  /DATABASE_URL/i,
  /AUTH_SECRET/i,
  /API_KEY/i,
  /CREDENTIAL/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

export function maskValue(key: string, value: string): string {
  if (!value) return value;
  return isSensitiveKey(key) ? '********' : value;
}
