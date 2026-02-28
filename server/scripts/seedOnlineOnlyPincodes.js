/**
 * Seed script — Online-Only Pincodes from Serviceability report
 * Source: Serviceability-Large-28-02-2026-08-39-PM.xlsx
 * Filter: COD === false across all sheets (LM + LM Embargo = ~1764 unique pincodes)
 *
 * Behaviour:
 *   - If pincode already exists with blockLevel 'partial-cod' → updates to 'online-only'
 *   - If pincode already exists with blockLevel 'online-only'  → skips (already correct)
 *   - If pincode does not exist → creates new with blockLevel 'online-only'
 *
 * Run: node scripts/seedOnlineOnlyPincodes.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const CodBlockedPincode = require('../models/codBlockedPincode');

async function seed() {
  // ── 1. Read Excel (all sheets) ───────────────────────────────────────────
  const wb = xlsx.readFile('d:/Downloads/Serviceability-Large-28-02-2026-08-39-PM.xlsx');

  // Collect COD=false pincodes across every sheet, deduplicated by pincode
  const pinMap = new Map(); // pincode → { pincode, state }
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws);
    rows
      .filter(r => r.COD === false || r.COD === 0)
      .forEach(r => {
        const pin = String(r.PINCODE || r.pincode || '').trim();
        const state = r.State || r.state || r['Hub state'] || '';
        if (pin && /^\d{6}$/.test(pin)) {
          pinMap.set(pin, { pin, state, sheet: sheetName });
        }
      });
    console.log(`  Sheet "${sheetName}": ${rows.length} rows, ${rows.filter(r => r.COD === false || r.COD === 0).length} no-COD`);
  });

  const uniquePins = [...pinMap.values()];
  console.log(`\n📋 Total unique no-COD pincodes across all sheets: ${uniquePins.length}`);

  // ── 2. Connect to MongoDB ────────────────────────────────────────────────
  await mongoose.connect(process.env.DATABASE);
  console.log('✅ Connected to MongoDB');

  // ── 3. Upsert each pincode (atomic — safe for Cosmos DB / replica sets) ──
  const stats = { upserted: 0, errors: 0 };

  for (const row of uniquePins) {
    const pin = String(row.pin).trim();
    const state = row.state || '';
    const reason = `Online-only — COD embargo${state ? ' (' + state + ')' : ''}`;

    try {
      await CodBlockedPincode.updateOne(
        { pincode: pin },
        {
          $set: { blockLevel: 'online-only', reason },
          $setOnInsert: { type: 'exact', advanceAmount: null, isActive: true }
        },
        { upsert: true }
      );
      stats.upserted++;
    } catch (err) {
      console.error(`❌ Error:    ${pin} — ${err.message}`);
      stats.errors++;
    }
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────
  const total = await CodBlockedPincode.countDocuments({ blockLevel: 'online-only' });
  console.log('\n🏁 Done —',
    `Upserted: ${stats.upserted} |`,
    `Errors: ${stats.errors} |`,
    `Total online-only in DB: ${total}`
  );

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
