/**
 * Seed Size Chart Templates
 * 
 * Run this script to populate the database with default size chart templates
 * Usage: cd server && node scripts/seedSizeCharts.js
 */

require("dotenv").config({ path: '../.env' });
const mongoose = require("mongoose");
const SizeChartTemplate = require("../models/sizeChartTemplate");

const sizeChartTemplates = [
  // ============================================
  // MEN'S SIZE CHARTS
  // ============================================
  {
    name: "Men's T-Shirt",
    displayTitle: "Men's T-Shirt Size Chart",
    description: "Standard fit men's t-shirt sizing",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "shoulder", label: "Shoulder (inches)" }
    ],
    measurements: [
      { size: "S", chest: "36-38", length: "28", shoulder: "17" },
      { size: "M", chest: "39-41", length: "29", shoulder: "18" },
      { size: "L", chest: "42-44", length: "30", shoulder: "19" },
      { size: "XL", chest: "45-47", length: "31", shoulder: "20" },
      { size: "XXL", chest: "48-50", length: "32", shoulder: "21" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Shoulder", instruction: "Measure from the edge of one shoulder to the edge of the other shoulder." }
    ],
    order: 1
  },
  {
    name: "Men's Printed Tee (BIOWASH)",
    displayTitle: "Printed T-Shirt Size Chart (BIOWASH)",
    description: "BIOWASH fabric printed t-shirt sizing - Note: BIOWASH fabric may shrink slightly after first wash",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" }
    ],
    measurements: [
      { size: "S", chest: "38", length: "26" },
      { size: "M", chest: "40", length: "27" },
      { size: "L", chest: "42", length: "28" },
      { size: "XL", chest: "44", length: "29" },
      { size: "XXL", chest: "46", length: "30" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." }
    ],
    note: "BIOWASH fabric may shrink slightly after the first wash. We recommend ordering one size up if you prefer a looser fit.",
    order: 2
  },
  {
    name: "Men's Oversized T-Shirt",
    displayTitle: "Oversized T-Shirt Size Chart",
    description: "Drop shoulder oversized fit t-shirt sizing",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "shoulder", label: "Shoulder (inches)" }
    ],
    measurements: [
      { size: "S", chest: "42", length: "28", shoulder: "22" },
      { size: "M", chest: "44", length: "29", shoulder: "23" },
      { size: "L", chest: "46", length: "30", shoulder: "24" },
      { size: "XL", chest: "48", length: "31", shoulder: "25" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Shoulder", instruction: "For oversized fit, shoulder seam sits lower on the arm (drop shoulder style)." }
    ],
    order: 3
  },
  {
    name: "Men's Hoodie (Regular Fit)",
    displayTitle: "Hoodie Size Chart (Regular Fit)",
    description: "Standard fit hoodie sizing",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "sleeve", label: "Sleeve (inches)" }
    ],
    measurements: [
      { size: "S", chest: "40", length: "26", sleeve: "24" },
      { size: "M", chest: "42", length: "27", sleeve: "25" },
      { size: "L", chest: "44", length: "28", sleeve: "26" },
      { size: "XL", chest: "46", length: "29", sleeve: "27" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Sleeve", instruction: "Measure from the shoulder seam to the end of the cuff." }
    ],
    order: 4
  },
  {
    name: "Men's Oversized Hoodie",
    displayTitle: "Oversized Hoodie Size Chart",
    description: "Drop shoulder oversized fit hoodie sizing",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "sleeve", label: "Sleeve (inches)" }
    ],
    measurements: [
      { size: "S", chest: "46", length: "27", sleeve: "22" },
      { size: "M", chest: "48", length: "28", sleeve: "23" },
      { size: "L", chest: "50", length: "29", sleeve: "24" },
      { size: "XL", chest: "52", length: "30", sleeve: "25" },
      { size: "XXL", chest: "54", length: "31", sleeve: "26" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Sleeve", instruction: "For oversized fit, sleeve length is measured from the drop shoulder seam." }
    ],
    order: 5
  },
  {
    name: "Men's Tank Top",
    displayTitle: "Tank Top Size Chart",
    description: "Standard fit tank top sizing",
    gender: "men",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" }
    ],
    measurements: [
      { size: "S", chest: "36", length: "27" },
      { size: "M", chest: "38", length: "28" },
      { size: "L", chest: "40", length: "29" },
      { size: "XL", chest: "42", length: "30" },
      { size: "XXL", chest: "44", length: "31" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." }
    ],
    order: 6
  },

  // ============================================
  // WOMEN'S SIZE CHARTS
  // ============================================
  {
    name: "Women's T-Shirt",
    displayTitle: "Women's T-Shirt Size Chart",
    description: "Standard fit women's t-shirt sizing",
    gender: "women",
    headers: [
      { key: "size", label: "Size" },
      { key: "bust", label: "Bust (inches)" },
      { key: "waist", label: "Waist (inches)" },
      { key: "length", label: "Length (inches)" }
    ],
    measurements: [
      { size: "XS", bust: "32-34", waist: "24-26", length: "24" },
      { size: "S", bust: "34-36", waist: "26-28", length: "25" },
      { size: "M", bust: "36-38", waist: "28-30", length: "26" },
      { size: "L", bust: "38-40", waist: "30-32", length: "27" },
      { size: "XL", bust: "40-42", waist: "32-34", length: "28" },
      { size: "XXL", bust: "42-44", waist: "34-36", length: "29" }
    ],
    measurementGuide: [
      { part: "Bust", instruction: "Measure around the fullest part of your bust, keeping the tape horizontal." },
      { part: "Waist", instruction: "Measure around your natural waistline, the narrowest part of your torso." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." }
    ],
    order: 10
  },
  {
    name: "Women's Fitted T-Shirt",
    displayTitle: "Women's Fitted T-Shirt Size Chart",
    description: "Slim fit women's t-shirt sizing - designed for a closer body fit",
    gender: "women",
    headers: [
      { key: "size", label: "Size" },
      { key: "bust", label: "Bust (inches)" },
      { key: "waist", label: "Waist (inches)" },
      { key: "hip", label: "Hip (inches)" },
      { key: "length", label: "Length (inches)" }
    ],
    measurements: [
      { size: "XS", bust: "30-32", waist: "23-25", hip: "33-35", length: "23" },
      { size: "S", bust: "32-34", waist: "25-27", hip: "35-37", length: "24" },
      { size: "M", bust: "34-36", waist: "27-29", hip: "37-39", length: "25" },
      { size: "L", bust: "36-38", waist: "29-31", hip: "39-41", length: "26" },
      { size: "XL", bust: "38-40", waist: "31-33", hip: "41-43", length: "27" }
    ],
    measurementGuide: [
      { part: "Bust", instruction: "Measure around the fullest part of your bust, keeping the tape horizontal." },
      { part: "Waist", instruction: "Measure around your natural waistline, the narrowest part of your torso." },
      { part: "Hip", instruction: "Measure around the fullest part of your hips, about 8 inches below your waist." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." }
    ],
    order: 11
  },
  {
    name: "Women's Oversized T-Shirt",
    displayTitle: "Women's Oversized T-Shirt Size Chart",
    description: "Relaxed oversized fit for women",
    gender: "women",
    headers: [
      { key: "size", label: "Size" },
      { key: "bust", label: "Bust (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "shoulder", label: "Shoulder Drop (inches)" }
    ],
    measurements: [
      { size: "S", bust: "40", length: "27", shoulder: "21" },
      { size: "M", bust: "42", length: "28", shoulder: "22" },
      { size: "L", bust: "44", length: "29", shoulder: "23" },
      { size: "XL", bust: "46", length: "30", shoulder: "24" }
    ],
    measurementGuide: [
      { part: "Bust", instruction: "Measure around the fullest part of your bust, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Shoulder Drop", instruction: "For oversized fit, the shoulder seam sits lower on the arm (drop shoulder style)." }
    ],
    order: 12
  },
  {
    name: "Women's Crop Top",
    displayTitle: "Women's Crop Top Size Chart",
    description: "Cropped length women's top sizing",
    gender: "women",
    headers: [
      { key: "size", label: "Size" },
      { key: "bust", label: "Bust (inches)" },
      { key: "waist", label: "Waist (inches)" },
      { key: "length", label: "Length (inches)" }
    ],
    measurements: [
      { size: "XS", bust: "30-32", waist: "23-25", length: "16" },
      { size: "S", bust: "32-34", waist: "25-27", length: "17" },
      { size: "M", bust: "34-36", waist: "27-29", length: "18" },
      { size: "L", bust: "36-38", waist: "29-31", length: "19" },
      { size: "XL", bust: "38-40", waist: "31-33", length: "20" }
    ],
    measurementGuide: [
      { part: "Bust", instruction: "Measure around the fullest part of your bust, keeping the tape horizontal." },
      { part: "Waist", instruction: "Measure around your natural waistline, the narrowest part of your torso." },
      { part: "Length", instruction: "Crop tops are designed to end above the natural waist." }
    ],
    order: 13
  },
  {
    name: "Women's Hoodie",
    displayTitle: "Women's Hoodie Size Chart",
    description: "Regular fit women's hoodie sizing",
    gender: "women",
    headers: [
      { key: "size", label: "Size" },
      { key: "bust", label: "Bust (inches)" },
      { key: "waist", label: "Waist (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "sleeve", label: "Sleeve (inches)" }
    ],
    measurements: [
      { size: "XS", bust: "36", waist: "28", length: "24", sleeve: "22" },
      { size: "S", bust: "38", waist: "30", length: "25", sleeve: "23" },
      { size: "M", bust: "40", waist: "32", length: "26", sleeve: "24" },
      { size: "L", bust: "42", waist: "34", length: "27", sleeve: "25" },
      { size: "XL", bust: "44", waist: "36", length: "28", sleeve: "26" }
    ],
    measurementGuide: [
      { part: "Bust", instruction: "Measure around the fullest part of your bust, keeping the tape horizontal." },
      { part: "Waist", instruction: "Measure around your natural waistline, the narrowest part of your torso." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Sleeve", instruction: "Measure from the shoulder seam to the end of the cuff." }
    ],
    order: 14
  },

  // ============================================
  // UNISEX SIZE CHARTS
  // ============================================
  {
    name: "Unisex T-Shirt",
    displayTitle: "Unisex T-Shirt Size Chart",
    description: "Standard unisex fit suitable for all genders",
    gender: "unisex",
    headers: [
      { key: "size", label: "Size" },
      { key: "chest", label: "Chest (inches)" },
      { key: "length", label: "Length (inches)" },
      { key: "shoulder", label: "Shoulder (inches)" }
    ],
    measurements: [
      { size: "XS", chest: "34-36", length: "26", shoulder: "16" },
      { size: "S", chest: "36-38", length: "27", shoulder: "17" },
      { size: "M", chest: "38-40", length: "28", shoulder: "18" },
      { size: "L", chest: "40-42", length: "29", shoulder: "19" },
      { size: "XL", chest: "42-44", length: "30", shoulder: "20" },
      { size: "XXL", chest: "44-46", length: "31", shoulder: "21" }
    ],
    measurementGuide: [
      { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape horizontal." },
      { part: "Length", instruction: "Measure from the highest point of the shoulder to the bottom hem." },
      { part: "Shoulder", instruction: "Measure from the edge of one shoulder to the edge of the other shoulder." }
    ],
    note: "Unisex sizing - Women may prefer to size down for a more fitted look.",
    order: 20
  }
];

async function seedSizeCharts() {
  try {
    // Connect to database
    const dbUri = process.env.DATABASE || 'mongodb://localhost:27017/tshirt-shop';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to database");

    // Check if size charts already exist
    const existingCount = await SizeChartTemplate.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing size chart templates.`);
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to delete existing and re-seed? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log("❌ Seeding cancelled.");
        process.exit(0);
      }

      await SizeChartTemplate.deleteMany({});
      console.log("🗑️ Deleted existing size chart templates");
    }

    // Insert all templates
    const result = await SizeChartTemplate.insertMany(sizeChartTemplates);
    console.log(`✅ Successfully seeded ${result.length} size chart templates:`);
    
    // Group by gender for display
    const menCharts = result.filter(c => c.gender === 'men');
    const womenCharts = result.filter(c => c.gender === 'women');
    const unisexCharts = result.filter(c => c.gender === 'unisex');

    console.log("\n📊 Men's Charts:");
    menCharts.forEach(c => console.log(`   - ${c.name} (${c._id})`));
    
    console.log("\n👗 Women's Charts:");
    womenCharts.forEach(c => console.log(`   - ${c.name} (${c._id})`));
    
    console.log("\n🔄 Unisex Charts:");
    unisexCharts.forEach(c => console.log(`   - ${c.name} (${c._id})`));

    console.log("\n✨ Size chart seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding size charts:", error);
    process.exit(1);
  }
}

seedSizeCharts();
