const mongoose = require("mongoose");
const Category = require("../models/category");
require("dotenv").config({ path: "../.env" });

// MongoDB connection
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const animeSubcategories = [
  { name: "Naruto", icon: "🍜" },
  { name: "One Piece", icon: "🏴‍☠️" },
  { name: "Demon Slayer", icon: "⚔️" },
  { name: "Attack on Titan", icon: "🗡️" },
  { name: "Jujutsu Kaisen", icon: "👹" },
  { name: "Dragon Ball", icon: "🐉" },
  { name: "My Hero Academia", icon: "🦸" },
  { name: "Death Note", icon: "📓" },
  { name: "Tokyo Ghoul", icon: "👺" },
  { name: "Hunter x Hunter", icon: "🎯" },
  { name: "Bleach", icon: "⚡" },
  { name: "Fullmetal Alchemist", icon: "⚗️" }
];

const seedAnimeCategories = async () => {
  try {
    console.log("Starting anime categories seeding...");
    
    // First, find or create the main Anime category
    let animeCategory = await Category.findOne({ 
      name: "Anime", 
      parentCategory: null,
      level: 0 
    });
    
    if (!animeCategory) {
      animeCategory = await Category.create({
        name: "Anime",
        slug: "anime",
        parentCategory: null,
        level: 0,
        icon: "🎌",
        isActive: true
      });
      console.log("Created main Anime category");
    } else {
      console.log("Found existing Anime category");
    }
    
    // Create subcategories for each anime
    for (const anime of animeSubcategories) {
      const existingSubcategory = await Category.findOne({
        name: anime.name,
        parentCategory: animeCategory._id
      });
      
      if (!existingSubcategory) {
        await Category.create({
          name: anime.name,
          parentCategory: animeCategory._id,
          level: 1,
          icon: anime.icon,
          isActive: true
        });
        console.log(`Created subcategory: ${anime.name}`);
      } else {
        console.log(`Subcategory already exists: ${anime.name}`);
      }
    }
    
    // Also ensure we have product type categories
    const productTypeCategories = [
      { name: "T-Shirts", icon: "👕" },
      { name: "Hoodies", icon: "🧥" },
      { name: "Accessories", icon: "🎒" }
    ];
    
    for (const category of productTypeCategories) {
      const existing = await Category.findOne({
        name: category.name,
        parentCategory: null,
        level: 0
      });
      
      if (!existing) {
        await Category.create({
          name: category.name,
          parentCategory: null,
          level: 0,
          icon: category.icon,
          isActive: true
        });
        console.log(`Created category: ${category.name}`);
      }
    }
    
    console.log("Anime categories seeding completed!");
    
    // Display category hierarchy
    console.log("\n=== Category Hierarchy ===");
    const allCategories = await Category.find().sort({ level: 1, name: 1 });
    
    for (const cat of allCategories) {
      if (cat.level === 0) {
        console.log(`\n${cat.icon} ${cat.name} (Main Category)`);
        const subcats = await Category.find({ parentCategory: cat._id });
        for (const subcat of subcats) {
          console.log(`  └─ ${subcat.icon} ${subcat.name}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding anime categories:", error);
    process.exit(1);
  }
};

seedAnimeCategories();
