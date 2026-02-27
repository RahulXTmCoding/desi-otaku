const CodBlockedPincode = require("../models/codBlockedPincode");
const Settings = require("../models/settings");

// List all blocked pincodes (paginated, with search)
exports.listBlockedPincodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || "";
    const type = req.query.type || ""; // "exact" | "prefix" | ""
    const activeOnly = req.query.activeOnly === "true";

    const filter = {};
    if (search) {
      filter.pincode = { $regex: search, $options: "i" };
    }
    if (type) {
      filter.type = type;
    }
    if (activeOnly) {
      filter.isActive = true;
    }

    const total = await CodBlockedPincode.countDocuments(filter);
    const pincodes = await CodBlockedPincode.find(filter)
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Also return the global advance amount
    const globalAdvanceAmount = await Settings.getSetting("partial_cod_advance_amount", 100);

    res.json({
      success: true,
      pincodes,
      globalAdvanceAmount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("listBlockedPincodes error:", error);
    res.status(500).json({ error: "Failed to fetch blocked pincodes" });
  }
};

// Add a single blocked pincode
exports.addBlockedPincode = async (req, res) => {
  try {
    const { pincode, type = "exact", advanceAmount, reason } = req.body;
    const userId = req.profile._id;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    // Validate length: exact = 6 digits, prefix = 3–5 digits
    const pin = pincode.trim();
    if (type === "exact" && !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ error: "Exact pincode must be exactly 6 digits" });
    }
    if (type === "prefix" && !/^\d{3,5}$/.test(pin)) {
      return res.status(400).json({ error: "Prefix must be 3–5 digits" });
    }

    const existing = await CodBlockedPincode.findOne({ pincode: pin });
    if (existing) {
      return res.status(409).json({ error: `Pincode ${pin} already exists` });
    }

    const newPincode = new CodBlockedPincode({
      pincode: pin,
      type,
      advanceAmount: advanceAmount || null,
      reason: reason || "High RTO area",
      isActive: true,
      addedBy: userId
    });

    const saved = await newPincode.save();

    res.status(201).json({ success: true, pincode: saved, message: `Pincode ${pin} blocked for full COD` });
  } catch (error) {
    console.error("addBlockedPincode error:", error);
    res.status(500).json({ error: "Failed to add blocked pincode", details: error.message });
  }
};

// Bulk add pincodes — comma-separated string
exports.bulkAddBlockedPincodes = async (req, res) => {
  try {
    const { pincodes: rawInput, type = "exact", advanceAmount, reason } = req.body;
    const userId = req.profile._id;

    if (!rawInput) {
      return res.status(400).json({ error: "pincodes field is required (comma-separated)" });
    }

    // Parse comma-separated input, trim whitespace, deduplicate
    const pins = [...new Set(
      rawInput.split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    )];

    if (pins.length === 0) {
      return res.status(400).json({ error: "No valid pincodes found in input" });
    }

    const results = { added: [], skipped: [], errors: [] };

    for (const pin of pins) {
      // Validate format
      if (type === "exact" && !/^\d{6}$/.test(pin)) {
        results.errors.push({ pincode: pin, error: "Must be 6 digits for exact type" });
        continue;
      }
      if (type === "prefix" && !/^\d{3,5}$/.test(pin)) {
        results.errors.push({ pincode: pin, error: "Must be 3–5 digits for prefix type" });
        continue;
      }

      try {
        const existing = await CodBlockedPincode.findOne({ pincode: pin });
        if (existing) {
          results.skipped.push(pin);
          continue;
        }

        const newDoc = new CodBlockedPincode({
          pincode: pin,
          type,
          advanceAmount: advanceAmount || null,
          reason: reason || "High RTO area",
          isActive: true,
          addedBy: userId
        });
        await newDoc.save();
        results.added.push(pin);
      } catch (err) {
        results.errors.push({ pincode: pin, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Added ${results.added.length}, skipped ${results.skipped.length} duplicates, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    console.error("bulkAddBlockedPincodes error:", error);
    res.status(500).json({ error: "Bulk add failed", details: error.message });
  }
};

// Update a blocked pincode (reason, active toggle, advance amount override)
exports.updateBlockedPincode = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, isActive, advanceAmount } = req.body;
    const userId = req.profile._id;

    const updateData = { updatedAt: new Date() };
    if (reason !== undefined) updateData.reason = reason;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (advanceAmount !== undefined) {
      updateData.advanceAmount = advanceAmount === "" || advanceAmount === null ? null : Number(advanceAmount);
    }
    updateData.addedBy = userId;

    const updated = await CodBlockedPincode.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ error: "Pincode not found" });
    }

    res.json({ success: true, pincode: updated, message: "Pincode updated successfully" });
  } catch (error) {
    console.error("updateBlockedPincode error:", error);
    res.status(500).json({ error: "Failed to update pincode" });
  }
};

// Delete a blocked pincode
exports.deleteBlockedPincode = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await CodBlockedPincode.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Pincode not found" });
    }

    res.json({ success: true, message: `Pincode ${deleted.pincode} removed from block list` });
  } catch (error) {
    console.error("deleteBlockedPincode error:", error);
    res.status(500).json({ error: "Failed to delete pincode" });
  }
};

// Update global advance amount setting
exports.updateGlobalAdvanceAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.profile._id;

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const numAmount = Number(amount);
    if (numAmount < 1) {
      return res.status(400).json({ error: "Amount must be at least ₹1" });
    }

    await Settings.setSetting(
      "partial_cod_advance_amount",
      numAmount,
      "Advance amount (₹) customers pay online for Partial COD orders. Rest is paid at delivery.",
      userId
    );

    res.json({
      success: true,
      amount: numAmount,
      message: `Global Partial COD advance amount updated to ₹${numAmount}`
    });
  } catch (error) {
    console.error("updateGlobalAdvanceAmount error:", error);
    res.status(500).json({ error: "Failed to update global advance amount" });
  }
};
