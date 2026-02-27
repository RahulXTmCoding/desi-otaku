import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Trash2, Plus, Upload, AlertCircle, CheckCircle, Loader, Edit2, X } from "lucide-react";
import { isAutheticated } from "../auth/helper";
import {
  listBlockedPincodes,
  addBlockedPincode,
  bulkAddBlockedPincodes,
  updateBlockedPincode,
  deleteBlockedPincode,
  updateGlobalAdvanceAmount
} from "../core/helper/codPincodeHelper";

interface BlockedPincode {
  _id: string;
  pincode: string;
  type: "exact" | "prefix";
  advanceAmount: number | null;
  reason: string;
  isActive: boolean;
  addedBy?: { name: string; email: string };
  createdAt: string;
}

const ManageCodPincodes = () => {
  const auth = isAutheticated() as any;
  const token = auth?.token || "";
  const userId = auth?.user?._id || "";

  // List state
  const [pincodes, setPincodes] = useState<BlockedPincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [globalAdvanceAmount, setGlobalAdvanceAmount] = useState<number>(100);

  // Global setting edit state
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [globalAmountInput, setGlobalAmountInput] = useState<string>("100");
  const [globalSaving, setGlobalSaving] = useState(false);

  // Single add form
  const [singlePin, setSinglePin] = useState("");
  const [singleType, setSingleType] = useState<"exact" | "prefix">("exact");
  const [singleAdvance, setSingleAdvance] = useState("");
  const [singleReason, setSingleReason] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");

  // Bulk add form
  const [showBulk, setShowBulk] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkType, setBulkType] = useState<"exact" | "prefix">("exact");
  const [bulkAdvance, setBulkAdvance] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editAdvance, setEditAdvance] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  if (!auth || !auth.user || auth.user.role !== 1) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const loadPincodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBlockedPincodes(userId, token, { search, limit: 100 });
      if (data.success) {
        setPincodes(data.pincodes || []);
        setGlobalAdvanceAmount(data.globalAdvanceAmount ?? 100);
        setGlobalAmountInput(String(data.globalAdvanceAmount ?? 100));
      }
    } catch (err) {
      console.error("loadPincodes error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, token, search]);

  useEffect(() => {
    loadPincodes();
  }, [loadPincodes]);

  // ── Global advance amount ──────────────────────────────────

  const handleSaveGlobal = async () => {
    const amount = Number(globalAmountInput);
    if (!amount || amount < 1) {
      alert("Please enter a valid amount (minimum ₹1)");
      return;
    }
    setGlobalSaving(true);
    try {
      const data = await updateGlobalAdvanceAmount(userId, token, amount);
      if (data.success) {
        setGlobalAdvanceAmount(amount);
        setEditingGlobal(false);
        alert(`Global advance amount updated to ₹${amount}`);
      } else {
        alert(data.error || "Failed to update");
      }
    } catch (err) {
      alert("Failed to update global advance amount");
    } finally {
      setGlobalSaving(false);
    }
  };

  // ── Single add ─────────────────────────────────────────────

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError("");
    setSingleSuccess("");
    if (!singlePin.trim()) {
      setSingleError("Pincode is required");
      return;
    }
    setSingleLoading(true);
    try {
      const data = await addBlockedPincode(userId, token, {
        pincode: singlePin.trim(),
        type: singleType,
        advanceAmount: singleAdvance ? Number(singleAdvance) : null,
        reason: singleReason || "High RTO area"
      });
      if (data.success) {
        setSingleSuccess(`Pincode ${singlePin} blocked successfully`);
        setSinglePin("");
        setSingleAdvance("");
        setSingleReason("");
        loadPincodes();
      } else {
        setSingleError(data.error || "Failed to add pincode");
      }
    } catch (err) {
      setSingleError("Failed to add pincode");
    } finally {
      setSingleLoading(false);
    }
  };

  // ── Bulk add ───────────────────────────────────────────────

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) {
      alert("Please enter comma-separated pincodes");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const data = await bulkAddBlockedPincodes(userId, token, {
        pincodes: bulkInput,
        type: bulkType,
        advanceAmount: bulkAdvance ? Number(bulkAdvance) : null,
        reason: bulkReason || "High RTO area"
      });
      if (data.success) {
        setBulkResult(data.results);
        setBulkInput("");
        loadPincodes();
      } else {
        alert(data.error || "Bulk add failed");
      }
    } catch (err) {
      alert("Bulk add failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────

  const handleToggleActive = async (pincode: BlockedPincode) => {
    try {
      const data = await updateBlockedPincode(pincode._id, userId, token, { isActive: !pincode.isActive });
      if (data.success) {
        loadPincodes();
      } else {
        alert(data.error || "Failed to update");
      }
    } catch (err) {
      alert("Failed to update pincode");
    }
  };

  // ── Inline edit ────────────────────────────────────────────

  const startEdit = (p: BlockedPincode) => {
    setEditingId(p._id);
    setEditReason(p.reason);
    setEditAdvance(p.advanceAmount !== null ? String(p.advanceAmount) : "");
  };

  const handleSaveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      const data = await updateBlockedPincode(id, userId, token, {
        reason: editReason,
        advanceAmount: editAdvance === "" ? null : Number(editAdvance)
      });
      if (data.success) {
        setEditingId(null);
        loadPincodes();
      } else {
        alert(data.error || "Failed to update");
      }
    } catch (err) {
      alert("Failed to update");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────

  const handleDelete = async (id: string, pincode: string) => {
    if (!window.confirm(`Remove pincode ${pincode} from block list?`)) return;
    try {
      const data = await deleteBlockedPincode(id, userId, token);
      if (data.success) {
        loadPincodes();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete pincode");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Admin Home
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-400" />
            COD Pincode Management
          </h1>
        </div>

        <p className="text-gray-400 mb-6">
          Pincodes added here will block full Cash on Delivery. Customers in these areas will see
          a <span className="text-amber-400 font-medium">Partial COD</span> option — pay a small advance online, rest at delivery.
        </p>

        {/* ── Global Advance Amount ─────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Global Advance Amount</h2>
              <p className="text-sm text-gray-400">Default amount customers pay online for Partial COD (per-pincode overrides this)</p>
            </div>
            {!editingGlobal && (
              <button
                onClick={() => setEditingGlobal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          {editingGlobal ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-400">₹</span>
              <input
                type="number"
                min={1}
                value={globalAmountInput}
                onChange={(e) => setGlobalAmountInput(e.target.value)}
                className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                placeholder="100"
              />
              <button
                onClick={handleSaveGlobal}
                disabled={globalSaving}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"
              >
                {globalSaving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={() => { setEditingGlobal(false); setGlobalAmountInput(String(globalAdvanceAmount)); }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-3xl font-bold text-amber-400">₹{globalAdvanceAmount}</p>
          )}
        </div>

        {/* ── Add Pincode(s) ───────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Add Blocked Pincode(s)</h2>
            <button
              onClick={() => setShowBulk(!showBulk)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showBulk ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Upload className="w-4 h-4" />
              {showBulk ? "Single Add" : "Bulk Import"}
            </button>
          </div>

          {!showBulk ? (
            /* Single Add Form */
            <form onSubmit={handleAddSingle} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={singlePin}
                    onChange={(e) => setSinglePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={singleType === "exact" ? "e.g. 845401" : "e.g. 845"}
                    maxLength={6}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select
                    value={singleType}
                    onChange={(e) => setSingleType(e.target.value as "exact" | "prefix")}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="exact">Exact (6-digit pincode)</option>
                    <option value="prefix">Prefix (3-digit, blocks entire range)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Advance Amount Override (₹) <span className="text-gray-500">— leave blank to use global ₹{globalAdvanceAmount}</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={singleAdvance}
                    onChange={(e) => setSingleAdvance(e.target.value)}
                    placeholder={`Global default: ₹${globalAdvanceAmount}`}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Reason</label>
                  <input
                    type="text"
                    value={singleReason}
                    onChange={(e) => setSingleReason(e.target.value)}
                    placeholder="High RTO area"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              {singleError && (
                <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{singleError}</p>
              )}
              {singleSuccess && (
                <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{singleSuccess}</p>
              )}
              <button
                type="submit"
                disabled={singleLoading}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm"
              >
                {singleLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Block Pincode
              </button>
            </form>
          ) : (
            /* Bulk Import Form */
            <form onSubmit={handleBulkAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Pincodes (comma-separated) *
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="845401, 845402, 845403, 845404..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none resize-y font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Separate pincodes with commas. Duplicates are automatically skipped.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as "exact" | "prefix")}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="exact">Exact</option>
                    <option value="prefix">Prefix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Advance Override (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkAdvance}
                    onChange={(e) => setBulkAdvance(e.target.value)}
                    placeholder={`Global: ₹${globalAdvanceAmount}`}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Reason</label>
                  <input
                    type="text"
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="High RTO area"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {bulkResult && (
                <div className="bg-gray-700 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-green-400">✅ Added: {bulkResult.added?.length || 0} pincodes</p>
                  <p className="text-yellow-400">⏭ Skipped (duplicates): {bulkResult.skipped?.length || 0}</p>
                  {bulkResult.errors?.length > 0 && (
                    <p className="text-red-400">❌ Errors: {bulkResult.errors?.length} — {bulkResult.errors?.map((e: any) => `${e.pincode}: ${e.error}`).join(", ")}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={bulkLoading}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm"
              >
                {bulkLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Bulk Import
              </button>
            </form>
          )}
        </div>

        {/* ── Pincode List ─────────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Blocked Pincodes ({pincodes.length})</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pincode..."
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none w-40"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : pincodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No blocked pincodes yet. Add some above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pincodes.map((p) => (
                <div
                  key={p._id}
                  className={`rounded-xl border p-4 transition-all ${
                    p.isActive ? "bg-gray-700 border-gray-600" : "bg-gray-800 border-gray-700 opacity-60"
                  }`}
                >
                  {editingId === p._id ? (
                    /* Inline Edit */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg text-amber-400 font-mono">{p.pincode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "prefix" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {p.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Reason</label>
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Advance Override (₹) — blank = global ₹{globalAdvanceAmount}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={editAdvance}
                            onChange={(e) => setEditAdvance(e.target.value)}
                            placeholder={`Global: ₹${globalAdvanceAmount}`}
                            className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(p._id)}
                          disabled={editSaving}
                          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm"
                        >
                          {editSaving ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-lg text-amber-400 font-mono">{p.pincode}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "prefix" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {p.type === "prefix" ? `Prefix (${p.pincode}xxx)` : "Exact"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"}`}>
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{p.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Advance:{" "}
                          {p.advanceAmount !== null ? (
                            <span className="text-amber-400 font-medium">₹{p.advanceAmount} (override)</span>
                          ) : (
                            <span className="text-gray-400">Global default (₹{globalAdvanceAmount})</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Active toggle */}
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                            p.isActive
                              ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                              : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                          }`}
                        >
                          {p.isActive ? "Disable" : "Enable"}
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => startEdit(p)}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(p._id, p.pincode)}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCodPincodes;
