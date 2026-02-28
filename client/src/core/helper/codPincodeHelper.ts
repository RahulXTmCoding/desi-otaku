import { API } from "../../backend";

// ─────────────────────────────────────────────────────────────
//  Public helpers (no auth required)
// ─────────────────────────────────────────────────────────────

/**
 * Check if a pincode is blocked for full COD.
 * Returns { codBlocked, advanceAmount, partialCodAvailable, reason }
 */
export const checkPincodeCod = (pincode: string) =>
  fetch(`${API}/cod/check-pincode`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pincode })
  }).then((r) => r.json());

/**
 * Create a Razorpay order for the advance amount only.
 * Returns { order, advanceAmount, remainingAmount, key }
 */
export const createPartialCodAdvanceOrder = (pincode: string, totalAmount: number) =>
  fetch(`${API}/cod/partial-advance/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pincode, totalAmount })
  }).then((r) => r.json());

// ─────────────────────────────────────────────────────────────
//  Admin helpers (require userId + token)
// ─────────────────────────────────────────────────────────────

/** List all blocked pincodes */
export const listBlockedPincodes = (
  userId: string,
  token: string,
  params: { page?: number; limit?: number; search?: string; type?: string; activeOnly?: boolean; blockLevel?: string } = {}
) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.type) qs.set("type", params.type);
  if (params.blockLevel) qs.set("blockLevel", params.blockLevel);
  if (params.activeOnly !== undefined) qs.set("activeOnly", String(params.activeOnly));
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return fetch(`${API}/cod-pincodes/${userId}${query}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  }).then((r) => r.json());
};

/** Add a single blocked pincode */
export const addBlockedPincode = (
  userId: string,
  token: string,
  data: { pincode: string; type?: string; advanceAmount?: number | null; reason?: string; blockLevel?: string }
) =>
  fetch(`${API}/cod-pincodes/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }).then((r) => r.json());

/** Bulk add pincodes from a comma-separated string */
export const bulkAddBlockedPincodes = (
  userId: string,
  token: string,
  data: { pincodes: string; type?: string; advanceAmount?: number | null; reason?: string; blockLevel?: string }
) =>
  fetch(`${API}/cod-pincodes/bulk/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }).then((r) => r.json());

/** Update a blocked pincode */
export const updateBlockedPincode = (
  id: string,
  userId: string,
  token: string,
  data: { reason?: string; isActive?: boolean; advanceAmount?: number | null; blockLevel?: string }
) =>
  fetch(`${API}/cod-pincodes/${id}/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }).then((r) => r.json());

/** Delete a blocked pincode */
export const deleteBlockedPincode = (id: string, userId: string, token: string) =>
  fetch(`${API}/cod-pincodes/${id}/${userId}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
  }).then((r) => r.json());

/** Update the global Partial COD advance amount */
export const updateGlobalAdvanceAmount = (userId: string, token: string, amount: number) =>
  fetch(`${API}/cod-pincodes/global-advance/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  }).then((r) => r.json());
