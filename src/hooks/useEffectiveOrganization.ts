import { useEffect, useMemo, useState } from 'react';

type JwtClaims = Record<string, unknown>;

type SensitiveClaims = {
  organization_id?: string;
  user_id?: string;
  organization_role?: number;
  is_admin?: boolean;
};

const nonceLength = 12;

export function decodeJwtPayload(jwt: string): JwtClaims | null {
  try {
    const payloadStr = jwt.split('.')[1];
    if (!payloadStr) return null;
    const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getAesGcmKeyFromSecret(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const sBytes = enc.encode(secret);
  const keyBytes = new Uint8Array(32);
  keyBytes.set(sBytes.subarray(0, Math.min(sBytes.length, 32)));
  // Pad with zeros if secret is shorter than 32 bytes (matches Golang logic)
  for (let i = sBytes.length; i < 32; i++) {
    keyBytes[i] = 0;
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
}

async function decryptAuthToken(token: string, secret: string): Promise<SensitiveClaims> {

  const bytes = base64UrlToUint8Array(token);

  const iv = bytes.slice(0, nonceLength);
  const ct = bytes.slice(nonceLength);

  const key = await getAesGcmKeyFromSecret(secret);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  const plainText = new TextDecoder().decode(new Uint8Array(plainBuf));

  return JSON.parse(plainText);
}

function getStringClaim(claims: JwtClaims | null | undefined, keys: string[]): string {
  if (!claims) return '';
  for (const key of keys) {
    const value = claims[key];
    if (value !== undefined && value !== null && value !== '') return String(value).trim();
  }
  return '';
}

function getBooleanClaim(claims: JwtClaims | null | undefined, keys: string[]): boolean | undefined {
  if (!claims) return undefined;
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }
  return undefined;
}

export function getEffectiveOrgId(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): string {
  const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
  const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
  const orgIdLocal = localStorage.getItem('organization_id') ?? '';
  // Prioritize sensitive claims first, then JWT, then local storage
  const result = String(orgIdFromSensitive || orgIdFromJwt || orgIdLocal || '').trim();
  return result;
}

export function getIsAdmin(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): boolean {
  const result = Boolean(sensitive?.is_admin ?? getBooleanClaim(claims, ['is_admin', 'isAdmin']) ?? false);
  console.log('[DEBUG getIsAdmin]', { sensitiveIsAdmin: sensitive?.is_admin, claimsIsAdmin: getBooleanClaim(claims, ['is_admin', 'isAdmin']), result });
  return result;
}

export function getRole(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): 'SuperAdmin' | 'Admin' | 'Members' {
  const isAdminClaim = Boolean(sensitive?.is_admin ?? getBooleanClaim(claims, ['is_admin', 'isAdmin']) ?? false);
  const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
  const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
  const organizationId = (orgIdFromSensitive || orgIdFromJwt || '').trim();
  console.log(" ------ ", {isAdminClaim, organizationId})
  if (isAdminClaim && organizationId === '00') {
    return 'SuperAdmin';
  } else if (isAdminClaim && organizationId !== '00' && organizationId !== '0') {
    return 'Admin';
  } else {
    return 'Members';
  }
}

export function getIsSuperAdmin(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): boolean {
  const isAdminClaim = Boolean(sensitive?.is_admin ?? getBooleanClaim(claims, ['is_admin', 'isAdmin']) ?? false);
  const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
  const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
  const organizationId = (orgIdFromSensitive || orgIdFromJwt || '').trim();
  const result = isAdminClaim && organizationId === '00';
  console.log('[DEBUG getIsSuperAdmin]', { isAdminClaim, organizationId, result });
  return result;
}

export function useEffectiveOrganization() {
  const [claims, setClaims] = useState<JwtClaims | null>(() => decodeJwtPayload(localStorage.getItem('token') ?? ''));
  const [sensitive, setSensitive] = useState<SensitiveClaims>({});
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const readClaims = () => decodeJwtPayload(localStorage.getItem('token') ?? '');

    const refresh = async () => {
      if (!mounted) return;
      setIsChecking(true);
      const currentClaims = readClaims();
      console.log('[DEBUG] currentClaims:', currentClaims);
      setClaims(currentClaims);
      setSensitive({});

      const secret = import.meta.env.VITE_JWT_SECRET;

      if (currentClaims && typeof currentClaims.token === 'string' && secret) {
        try {
          const decrypted = await decryptAuthToken(currentClaims.token, String(secret));
          console.log('[DEBUG] Decrypted sensitive data:', decrypted);
          if (mounted) setSensitive(decrypted);
        } catch (err) {
          console.error('[DEBUG] Decryption FAILED:', err);
          if (mounted) setSensitive({});
        }
      }

      if (mounted) setIsChecking(false);
    };

    void refresh();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' || event.key === 'organization_id') {
        void refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const effectiveOrgId = useMemo(() => getEffectiveOrgId(claims, sensitive), [claims, sensitive]);
  const isAdmin = useMemo(() => getIsAdmin(claims, sensitive), [claims, sensitive]);
  const hasEffectiveOrganization = effectiveOrgId !== '';
  const role = useMemo(() => getRole(claims, sensitive), [claims, sensitive]);
  const isSuperAdmin = useMemo(() => getIsSuperAdmin(claims, sensitive), [claims, sensitive]);

  return {
    claims,
    effectiveOrgId,
    hasEffectiveOrganization,
    isAdmin,
    isChecking,
    role,
    isSuperAdmin,
  };
}
