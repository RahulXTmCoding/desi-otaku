// Use 'import' if you are using ES Modules (add "type": "module" in your package.json)
import axios from 'axios';

// Or use 'require' if you are using CommonJS (the default in older Node.js)
// const axios = require('axios');

// --- Your Configuration ---
const YOUR_CATALOG_ID = process.env.FACEBOOK_CATALOG_ID;
const YOUR_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
// --------------------------

const API_URL = `https://graph.facebook.com/${API_VERSION}/${YOUR_CATALOG_ID}/items_batch`;

// Asynchronous function to run the API call
async function upsertProductsToFacebookCatalog(productsToUpsert) {
    if (!YOUR_CATALOG_ID || !YOUR_ACCESS_TOKEN) {
        console.error("Facebook Catalog API credentials are not set. Skipping upsert.");
        return;
    }

    console.log(`Sending upsert request for ${productsToUpsert.length} items to Facebook catalog ${YOUR_CATALOG_ID}...`);

    // This is the main payload for the API request
    const payload = {
        "access_token": YOUR_ACCESS_TOKEN,
        "item_type": "PRODUCT_ITEM",
        "allow_upsert": true, // This is the key for "upsert"
        "requests": productsToUpsert
    };

    try {
        const response = await axios.post(API_URL, payload);

        console.log("Success! Batch request submitted to Facebook Catalog.");
        console.log("API Response:", JSON.stringify(response.data));
        console.log("---");
        console.log("IMPORTANT: This batch is now processing in the background.");
        console.log(`Use this handle to check its status: ${response.data.handle}`);
        return response.data;

    } catch (error) {
        console.error("Error submitting batch request to Facebook Catalog:");

        // This helps show the specific error message from Meta
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
        throw error; // Re-throw the error for upstream handling
    }
}

export { upsertProductsToFacebookCatalog };
