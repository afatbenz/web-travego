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
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return undefined;
}

function getLocalUser(): { isAdmin?: boolean; isSuperAdmin?: boolean; role?: string } | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function updateLocalUser(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims
) {
  try {
    const existingUserStr = localStorage.getItem('user');
    const existingUser = existingUserStr ? JSON.parse(existingUserStr) : {};
    
    const isAdminClaim = Boolean(
      sensitive?.is_admin ??
      getBooleanClaim(claims, ['is_admin', 'isAdmin']) ??
      existingUser.isAdmin ??
      false
    );
    const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
    const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
    const organizationId = (orgIdFromSensitive || orgIdFromJwt || '').trim();
    const isSuperAdmin = isAdminClaim && organizationId === '00';
    let role: 'SuperAdmin' | 'Admin' | 'Members' = 'Members';
    if (isSuperAdmin) {
      role = 'SuperAdmin';
    } else if (isAdminClaim && organizationId !== '00' && organizationId !== '0') {
      role = 'Admin';
    }

    const updatedUser = {
      ...existingUser,
      isAdmin: isAdminClaim,
      isSuperAdmin,
      role
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
  } catch {
    // Ignore errors
  }
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
  const localUser = getLocalUser();
  const result = Boolean(
    sensitive?.is_admin ??
    getBooleanClaim(claims, ['is_admin', 'isAdmin']) ??
    localUser?.isAdmin ??
    false
  );
  return result;
}

export function getRole(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): 'SuperAdmin' | 'Admin' | 'Members' {
  const localUser = getLocalUser();
  const isAdminClaim = Boolean(
    sensitive?.is_admin ??
    getBooleanClaim(claims, ['is_admin', 'isAdmin']) ??
    localUser?.isAdmin ??
    false
  );
  const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
  const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
  const organizationId = (orgIdFromSensitive || orgIdFromJwt || '').trim();
  const isSuperAdminFromLocal = localUser?.isSuperAdmin ?? false;
  const roleFromLocal = localUser?.role;

  console.log(" ------ ", { isAdminClaim, organizationId, isSuperAdminFromLocal, roleFromLocal });

  if (isSuperAdminFromLocal || (isAdminClaim && organizationId === '00')) {
    return 'SuperAdmin';
  } else if (roleFromLocal === 'Admin' || (isAdminClaim && organizationId !== '00' && organizationId !== '0')) {
    return 'Admin';
  } else if (roleFromLocal === 'SuperAdmin') {
    return 'SuperAdmin';
  } else if (roleFromLocal === 'Members') {
    return 'Members';
  } else {
    return 'Members';
  }
}

export function getIsSuperAdmin(
  claims: JwtClaims | null | undefined,
  sensitive?: SensitiveClaims,
): boolean {
  const localUser = getLocalUser();
  const isAdminClaim = Boolean(
    sensitive?.is_admin ??
    getBooleanClaim(claims, ['is_admin', 'isAdmin']) ??
    localUser?.isAdmin ??
    false
  );
  const orgIdFromSensitive = typeof sensitive?.organization_id === 'string' ? sensitive.organization_id.trim() : '';
  const orgIdFromJwt = getStringClaim(claims, ['organization_id', 'org_id', 'organizationId']);
  const organizationId = (orgIdFromSensitive || orgIdFromJwt || '').trim();
  const result = (localUser?.isSuperAdmin ?? false) || (isAdminClaim && organizationId === '00');
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
      setClaims(currentClaims);
      setSensitive({});

      const secret = import.meta.env.VITE_JWT_SECRET;

      if (currentClaims && typeof currentClaims.token === 'string' && secret) {
        try {
          const decrypted = await decryptAuthToken(currentClaims.token, String(secret));
          const decrypted2 = await decryptAuthToken("gIXEdGoLZVbU7J4I_ZhmBh0RCeQuOwI71vybTdCjrSOc8n0BeP92thL-4U_y7fgt8YF_Npy3Chz6F07tB_y2FlguFqXM2lIAW3qIVw0D4i-jaDnKkz-DQq5GoJkpLB8YJr_hVUBhARtCHddRIqNCA86J9lUosj04CHGbt51W-HK7wQEi8oe0ezw=", String(secret));
          console.log({decrypted2})
          if (mounted) {
            setSensitive(decrypted);
            updateLocalUser(currentClaims, decrypted);
          }
        } catch (err) {
          if (mounted) {
            setSensitive({});
            updateLocalUser(currentClaims, {});
          }
        }
      } else {
        updateLocalUser(currentClaims, {});
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
