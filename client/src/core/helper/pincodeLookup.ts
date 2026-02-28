/**
 * pincodeLookup.ts
 * ─────────────────────────────────────────────────────────────
 * Efficient pincode → city (taluk) / district / state lookup
 * for Indian pincodes (19 K entries, ~137 KB gzipped).
 *
 * The lookup data is lazy-loaded on first use and cached for
 * the lifetime of the page — no repeated network requests.
 *
 * Data file  :  /data/pincodes-lookup.json
 * Generator  :  scripts/generate-pincode-lookup.js
 * ─────────────────────────────────────────────────────────────
 */

// ── Public types ─────────────────────────────────────────────

export interface PincodeInfo {
  /** City / Taluk name (title-cased)  e.g. "New Delhi" */
  city: string;
  /** District name (title-cased)      e.g. "Central Delhi" */
  district: string;
  /** State name (title-cased)         e.g. "Delhi" */
  state: string;
}

// ── Internal compact format (on-disk) ────────────────────────

interface PincodeLookupData {
  /** states index array  (35 entries) */
  s: string[];
  /** districts index array (~620 entries) */
  d: string[];
  /** taluks index array   (~4895 entries) */
  t: string[];
  /** pincode → [talukIdx, districtIdx, stateIdx] */
  p: Record<string, [number, number, number]>;
}

// ── Module-level cache ───────────────────────────────────────

let _dataPromise: Promise<PincodeLookupData> | null = null;
let _dataCache: PincodeLookupData | null = null;

const DATA_URL = "/data/pincodes-lookup.json";

// ── Internal helpers ─────────────────────────────────────────

/** Title-case an ALL-CAPS string: "ANDHRA PRADESH" → "Andhra Pradesh" */
const toTitleCase = (s: string): string =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Returns true for placeholder taluk values that mean "not available" */
const isNaTaluk = (s: string): boolean =>
  /^(na|n\/a|n\.a\.|nil|none|-)$/i.test(s.trim());

/**
 * Lazy-fetch the lookup data.
 * Returns the cached version immediately on subsequent calls.
 */
const loadData = (): Promise<PincodeLookupData> => {
  if (_dataCache) return Promise.resolve(_dataCache);
  if (_dataPromise) return _dataPromise;

  _dataPromise = fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Pincode data fetch failed: ${res.status}`);
      return res.json() as Promise<PincodeLookupData>;
    })
    .then((data) => {
      _dataCache = data;
      return data;
    })
    .catch((err) => {
      _dataPromise = null; // allow retry on next call
      throw err;
    });

  return _dataPromise;
};

/** Resolve a single 6-digit pincode string against a loaded dataset. */
const resolve = (pin: string, data: PincodeLookupData): PincodeInfo | null => {
  const entry = data.p[pin];
  if (!entry) return null;

  const [tIdx, dIdx, sIdx] = entry;
  const rawTaluk = data.t[tIdx];

  return {
    // Leave city blank when the source data has no real taluk (e.g. "NA")
    // so the user fills it in themselves rather than seeing "Na" pre-filled.
    city: isNaTaluk(rawTaluk) ? "" : toTitleCase(rawTaluk),
    district: toTitleCase(data.d[dIdx]),
    state: toTitleCase(data.s[sIdx]),
  };
};

// ── Public API ───────────────────────────────────────────────

/**
 * Async lookup — downloads data on first call, then O(1) cache hit.
 *
 * @example
 * ```ts
 * const info = await lookupPincode("110001");
 * // → { city: "New Delhi", district: "Central Delhi", state: "Delhi" }
 * ```
 *
 * @returns `PincodeInfo` or `null` if not found / invalid.
 */
export const lookupPincode = async (
  pincode: string,
): Promise<PincodeInfo | null> => {
  const pin = pincode.replace(/\D/g, "").padStart(6, "0");
  if (pin.length !== 6) return null;

  const data = await loadData();
  return resolve(pin, data);
};

/**
 * Synchronous lookup — returns `null` if data hasn't loaded yet.
 *
 * Pair with `preloadPincodeData()` to ensure data is ready before use:
 * ```ts
 * // On component mount
 * useEffect(() => { preloadPincodeData(); }, []);
 *
 * // On pincode change (instant after preload)
 * const info = lookupPincodeSync(pincode);
 * ```
 */
export const lookupPincodeSync = (pincode: string): PincodeInfo | null => {
  if (!_dataCache) return null;

  const pin = pincode.replace(/\D/g, "").padStart(6, "0");
  if (pin.length !== 6) return null;

  return resolve(pin, _dataCache);
};

/**
 * Kick off a background download of the lookup data.
 * Call this on page/component mount so data is ready by the
 * time the user types their first pincode.
 *
 * Safe to call multiple times — the fetch is deduplicated.
 */
export const preloadPincodeData = (): Promise<void> =>
  loadData().then(() => undefined);

/**
 * Returns `true` once the lookup data has been loaded into memory.
 */
export const isPincodeDataReady = (): boolean => _dataCache !== null;
