const axios = require('axios');

const TEST_MODE = process.env.SHIPROCKET_TEST_MODE === 'true';

class ShiprocketService {
  constructor() {
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
    this.email = process.env.SHIPROCKET_EMAIL || '';
    this.password = process.env.SHIPROCKET_PASSWORD || '';
    this.token = null;
    this.tokenExpiry = null;
  }

  // Get authentication token
  async authenticate() {
    if (TEST_MODE) {
      console.log('🧪 Shiprocket Test Mode: Simulating authentication');
      this.token = 'TEST_TOKEN_' + Date.now();
      return this.token;
    }

    try {
      // Check if token is still valid
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: this.email,
        password: this.password
      });

      this.token = response.data.token;
      // Token expires in 10 days, but we'll refresh it after 9 days
      this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Shiprocket authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  // Get shipping rates
  async getShippingRates(orderDetails) {
    if (TEST_MODE) {
      console.log('🧪 Test Mode: Simulating shipping rates for pincode:', orderDetails.pincode);
      
      // Validate pincode
      const isValidPincode = /^[1-9][0-9]{5}$/.test(orderDetails.pincode);
      if (!isValidPincode) {
        throw new Error('Invalid pincode');
      }
      
      // Simulate different rates based on pincode
      const baseRate = 50;
      const extraRate = parseInt(orderDetails.pincode.substring(0, 2)) % 30; // 0-29 extra based on first 2 digits
      const weightRate = (orderDetails.weight || 0.3) * 20; // ₹20 per kg
      
      return [
        {
          courier_id: 1,
          courier_name: "Delhivery Surface",
          rate: Math.round(baseRate + extraRate + weightRate),
          cod_charges: orderDetails.cod ? 40 : 0,
          estimated_delivery: "3-5 days",
          etd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          courier_id: 2,
          courier_name: "BlueDart Express",
          rate: Math.round((baseRate + extraRate + weightRate) * 1.8),
          cod_charges: orderDetails.cod ? 50 : 0,
          estimated_delivery: "1-2 days",
          etd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }

    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseURL}/courier/serviceability/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          pickup_postcode: process.env.PICKUP_PINCODE || '110001', // Your warehouse pincode
          delivery_postcode: orderDetails.pincode,
          cod: orderDetails.cod ? 1 : 0, // Cash on delivery
          weight: orderDetails.weight || 0.3, // Weight in kg
          declared_value: orderDetails.amount,
          length: orderDetails.length || 28,
          breadth: orderDetails.breadth || 22,
          height: orderDetails.height || 5
        }
      });

      // Return available couriers with rates
      return response.data.data.available_courier_companies.map(courier => ({
        courier_id: courier.courier_company_id,
        courier_name: courier.courier_name,
        rate: courier.rate,
        cod_charges: courier.cod_charges || 0,
        estimated_delivery: courier.estimated_delivery_days,
        etd: courier.etd // Estimated time of delivery
      }));
    } catch (error) {
      console.error('Shiprocket rate calculation error:', error.response?.data || error.message);
      throw new Error('Failed to calculate shipping rates');
    }
  }

  // Create shipment order
  async createShipment(orderData) {
    try {
      const token = await this.authenticate();
      
      const shipmentData = {
        order_id: orderData._id,
        order_date: new Date().toISOString(),
        pickup_location: "Primary", // Configure in Shiprocket dashboard
        channel_id: "", // Optional - sales channel
        comment: "T-Shirt Order",
        billing_customer_name: orderData.shipping.name,
        billing_last_name: "",
        billing_address: orderData.address,
        billing_city: orderData.shipping.city,
        billing_pincode: orderData.shipping.pincode,
        billing_state: orderData.shipping.state,
        billing_country: orderData.shipping.country || "India",
        billing_email: orderData.user.email,
        billing_phone: orderData.shipping.phone,
        shipping_is_billing: true,
        order_items: orderData.products.map(item => ({
          name: item.name,
          sku: item.product,
          units: item.count,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: "" // HSN code for t-shirts
        })),
        payment_method: orderData.cod ? "COD" : "Prepaid",
        sub_total: orderData.amount,
        length: orderData.shipping.length || 28,
        breadth: orderData.shipping.breadth || 22,
        height: orderData.shipping.height || 5,
        weight: orderData.shipping.weight || 0.3
      };

      const response = await axios.post(
        `${this.baseURL}/orders/create/adhoc`,
        shipmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        shipment_id: response.data.shipment_id,
        order_id: response.data.order_id,
        status: response.data.status,
        onboarding_completed_now: response.data.onboarding_completed_now,
        awb_code: response.data.awb_code,
        courier_company_id: response.data.courier_company_id,
        courier_name: response.data.courier_name
      };
    } catch (error) {
      console.error('Shiprocket shipment creation error:', error.response?.data || error.message);
      throw new Error('Failed to create shipment');
    }
  }

  // Generate AWB (Airway Bill)
  async generateAWB(shipmentId, courierId) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.post(
        `${this.baseURL}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          courier_id: courierId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        awb_code: response.data.response.data.awb_code,
        courier_name: response.data.response.data.courier_name,
        tracking_url: response.data.response.data.tracking_url
      };
    } catch (error) {
      console.error('Shiprocket AWB generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate AWB');
    }
  }

  // Schedule pickup
  async schedulePickup(shipmentId, pickupDate) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.post(
        `${this.baseURL}/courier/generate/pickup`,
        {
          shipment_id: [shipmentId],
          pickup_date: pickupDate || new Date().toISOString().split('T')[0]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket pickup scheduling error:', error.response?.data || error.message);
      throw new Error('Failed to schedule pickup');
    }
  }

  // Track shipment
  async trackShipment(shipmentId) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(
        `${this.baseURL}/courier/track/shipment/${shipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        tracking_data: response.data.tracking_data,
        shipment_track: response.data.shipment_track,
        current_status: response.data.tracking_data.shipment_status,
        awb_code: response.data.tracking_data.awb,
        courier_name: response.data.tracking_data.courier_name,
        etd: response.data.tracking_data.etd
      };
    } catch (error) {
      console.error('Shiprocket tracking error:', error.response?.data || error.message);
      throw new Error('Failed to track shipment');
    }
  }

  // Generate shipping label
  async generateLabel(shipmentId) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.post(
        `${this.baseURL}/courier/generate/label`,
        {
          shipment_id: [shipmentId]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        label_url: response.data.label_url,
        is_label_created: response.data.is_label_created
      };
    } catch (error) {
      console.error('Shiprocket label generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate shipping label');
    }
  }

  // Cancel shipment
  async cancelShipment(awbCode) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.post(
        `${this.baseURL}/orders/cancel`,
        {
          awbs: [awbCode]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket cancellation error:', error.response?.data || error.message);
      throw new Error('Failed to cancel shipment');
    }
  }

  // Check pincode serviceability
  async checkServiceability(pincode, weight = '0.3', cod = '1') {
    if (TEST_MODE) {
      console.log('🧪 Test Mode: Simulating serviceability check for pincode:', pincode);
      
      // Accept any valid 6-digit Indian pincode in test mode
      const isValidPincode = /^[1-9][0-9]{5}$/.test(pincode);
      const isServiceable = isValidPincode;
      
      // Simulate different rates based on pincode for variety
      const baseRate = 50;
      const extraRate = parseInt(pincode.substring(0, 2)) % 30; // 0-29 extra based on first 2 digits
      
      return {
        serviceable: isServiceable,
        available: isServiceable,
        available_couriers: isServiceable ? [
          { 
            courier_company_id: 1, 
            courier_name: 'Test Express', 
            rate: baseRate + extraRate,
            estimated_delivery: '3-5 days'
          },
          { 
            courier_company_id: 2, 
            courier_name: 'Test Priority', 
            rate: (baseRate + extraRate) * 2,
            estimated_delivery: '1-2 days'
          }
        ] : []
      };
    }

    try {
      const token = await this.authenticate();
      
      const response = await axios.get(
        `${this.baseURL}/courier/serviceability/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            pickup_postcode: process.env.PICKUP_PINCODE || '110001',
            delivery_postcode: pincode,
            weight: weight,
            cod: cod
          }
        }
      );

      return {
        serviceable: response.data.status === 200,
        available_couriers: response.data.data?.available_courier_companies || []
      };
    } catch (error) {
      console.error('Shiprocket serviceability check error:', error.response?.data || error.message);
      return {
        serviceable: false,
        available_couriers: []
      };
    }
  }
}

// Export singleton instance
module.exports = new ShiprocketService();
