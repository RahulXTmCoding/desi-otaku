const mongoose = require('mongoose');
const { Order } = require('./models/order');
const { createGuestOrder } = require('./controllers/guestOrder');
const { createOrder } = require('./controllers/order');
const User = require('./models/user');
require('dotenv').config();

// Mock product data
const mockProducts = [
  {
    product: '60d5f1b3b3f3e3b3f8f3e3b3', // A valid product ID
    name: 'Regular T-Shirt',
    count: 1,
    price: 500,
  },
  {
    product: 'custom',
    name: 'Custom T-Shirt',
    count: 1,
    price: 700,
    isCustom: true,
    customization: {
      frontDesign: {
        designId: '60d5f1b3b3f3e3b3f8f3e3b4',
        designImage: 'path/to/image.png',
        position: 'center',
        price: 150,
      },
    },
  },
];

// Mock request and response objects
const mockReq = (body, profile = null) => ({
  body,
  profile,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Test guest order creation
const testGuestOrder = async () => {
  console.log('--- Testing Guest Order Creation ---');
  const req = mockReq({
    products: mockProducts,
    transaction_id: 'GUEST_TRANS_ID_123',
    amount: 1200,
    address: '123 Guest St, Guestville',
    guestInfo: {
      name: 'Guest User',
      email: 'guest@example.com',
    },
  });
  const res = mockRes();

  // Mock Order.save
  Order.prototype.save = jest.fn().mockResolvedValue({
    ...req.body,
    _id: new mongoose.Types.ObjectId(),
    products: req.body.products.map(p => ({ ...p, product: p.product === 'custom' ? null : p.product })),
  });

  await createGuestOrder(req, res);

  if (res.status.mock.calls.length > 0 && res.status.mock.calls[0][0] !== 200) {
    console.error('Guest order creation failed:', res.json.mock.calls[0][0]);
  } else {
    console.log('Guest order creation successful.');
  }
};

// Test regular order creation
const testRegularOrder = async () => {
  console.log('\n--- Testing Regular Order Creation ---');
  const userProfile = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
  };
  const req = mockReq(
    {
      order: {
        products: mockProducts,
        transaction_id: 'REGULAR_TRANS_ID_456',
        amount: 1200,
        address: '456 User Ave, Userton',
      },
    },
    userProfile
  );
  const res = mockRes();

  // Mock Order.save
  Order.prototype.save = jest.fn().mockResolvedValue({
    ...req.body.order,
    _id: new mongoose.Types.ObjectId(),
    user: userProfile._id,
    products: req.body.order.products.map(p => ({ ...p, product: p.product === 'custom' ? null : p.product })),
  });

  // Mock Product.findById for validation
  const Product = require('./models/product');
  Product.findById = jest.fn().mockResolvedValue({
    _id: '60d5f1b3b3f3e3b3f8f3e3b3',
    name: 'Regular T-Shirt',
    price: 500,
    isDeleted: false,
  });

  await createOrder(req, res);

  if (res.status.mock.calls.length > 0 && res.status.mock.calls[0][0] !== 200) {
    console.error('Regular order creation failed:', res.json.mock.calls[0][0]);
  } else {
    console.log('Regular order creation successful.');
  }
};

// Run tests
const runTests = async () => {
  // Mock console to prevent logging during tests
  global.console.log = jest.fn();
  global.console.error = jest.fn();

  await testGuestOrder();
  await testRegularOrder();

  // Restore console
  delete global.console.log;
  delete global.console.error;
};

// Mock dependencies
jest.mock('./models/order', () => ({
  Order: jest.fn().mockImplementation(data => ({
    ...data,
    save: jest.fn(),
    populate: jest.fn().mockReturnThis(),
  })),
}));
jest.mock('./models/user');
jest.mock('./models/product');
jest.mock('./models/design');
jest.mock('./services/shiprocket', () => ({
  createShipment: jest.fn().mockResolvedValue({ shipment_id: 'sr_123' }),
}));
jest.mock('./services/emailService', () => ({
  sendOrderConfirmation: jest.fn(),
}));

runTests();
