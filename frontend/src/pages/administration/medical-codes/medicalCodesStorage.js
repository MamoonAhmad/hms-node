const SEED_VERSION_SUFFIX = '_seed_version';

export function getStoredCodes(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredCodes(storageKey, list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

/**
 * Loads stored codes or applies seed when empty or when seedVersion changes.
 */
export function ensureSeedData(storageKey, seed, seedVersion = 1) {
  const versionKey = `${storageKey}${SEED_VERSION_SUFFIX}`;
  const stored = getStoredCodes(storageKey);
  const savedVersion = localStorage.getItem(versionKey);

  if (stored.length === 0 || savedVersion !== String(seedVersion)) {
    setStoredCodes(storageKey, seed);
    localStorage.setItem(versionKey, String(seedVersion));
    return seed;
  }
  return stored;
}

export function createCodeRecord(formValues, { existingId } = {}) {
  const now = new Date().toISOString();
  return {
    id: existingId || crypto.randomUUID(),
    ...formValues,
    createdAt: existingId ? undefined : now,
    updatedAt: now,
  };
}

export function upsertCode(storageKey, formValues, existingId) {
  const list = getStoredCodes(storageKey);
  if (existingId) {
    const next = list.map((row) =>
      row.id === existingId
        ? {
            ...row,
            ...formValues,
            updatedAt: new Date().toISOString(),
          }
        : row,
    );
    setStoredCodes(storageKey, next);
    return next;
  }
  const next = [...list, createCodeRecord(formValues)];
  setStoredCodes(storageKey, next);
  return next;
}

export function deleteCode(storageKey, id) {
  const next = getStoredCodes(storageKey).filter((row) => row.id !== id);
  setStoredCodes(storageKey, next);
  return next;
}

export function isDuplicateCode(list, code, excludeId) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return false;
  return list.some(
    (row) =>
      row.id !== excludeId && String(row.code || '').trim().toUpperCase() === normalized,
  );
}
