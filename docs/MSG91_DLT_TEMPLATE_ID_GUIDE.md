# MSG91 DLT Template ID - Complete Step-by-Step Guide

## 🎯 **What is DLT Template ID?**

DLT (Distributed Ledger Technology) Template ID is a **mandatory requirement** from TRAI (Telecom Regulatory Authority of India) for all commercial SMS in India. Every SMS template must be pre-approved and registered with telecom operators.

**Without DLT Template ID**: Your SMS will be **blocked** by telecom operators.

## 📋 **Prerequisites**

Before getting DLT Template ID, ensure you have:
- ✅ **MSG91 Account** (verified and activated)
- ✅ **Business documents** (GST certificate, business registration)
- ✅ **Approved Sender ID** (6-character alphanumeric ID)
- ✅ **Principal Entity (PE) registration** with telecom operators

## 🚀 **Step 1: Register Principal Entity (PE)**

### **1.1 What is Principal Entity?**
Principal Entity is your business registration with telecom operators. This is required before creating any templates.

### **1.2 Register PE on MSG91**
1. **Login** to [MSG91 Dashboard](https://control.msg91.com/)
2. **Navigate** to `DLT` → `Principal Entity`
3. **Click** "Add New Principal Entity"
4. **Fill the form**:
   ```
   Entity Name: Your Business Name
   Entity Type: Select based on your business:
   - Chat: For messaging/chat services, customer support
   - Other: For general e-commerce, retail businesses
   - Banking: For financial institutions
   - Insurance: For insurance companies
   Entity ID: Will be auto-generated
   Communication Address: Your business address
   Authorized Signatory: Owner/Director name
   ```

#### **Choosing Correct Entity Type**
- **Chat**: If your business involves messaging, customer support, or chat-based services
- **Other**: For general e-commerce, retail, or small businesses
- **Banking**: Only for registered financial institutions
- **Insurance**: Only for registered insurance companies

**For your business, select "Other" as the entity type** (E-commerce/Retail).
5. **Upload Documents**:
   - GST Certificate (mandatory)
   - Business Registration Certificate
   - Authorized Signatory ID proof
   - Authorized Signatory Address proof

### **1.3 PE Approval Process**
- **Submission time**: 2-3 business days
- **Status check**: Dashboard → DLT → Principal Entity
- **Approval**: You'll receive email confirmation

## � **Step 2: Create Content Template**

### **2.1 Access Template Section**
1. **Login** to MSG91 Dashboard
2. **Navigate** to `DLT` → `Content Template`
3. **Click** "Add New Template"

### **2.2 Template Details Form**

#### **Basic Information**
```
Template Name: OTP Verification Template
Template Type: Service Explicit
Content Type: Text
Category: Service/Transactional
Sub-Category: OTP
```

#### **Template Content**
```
Template Message:
Your verification code for [VAR1] is [VAR2]. Valid for 5 minutes. Do not share this OTP with anyone.

Template Variables:
[VAR1] = Brand/Service name (e.g., "DESI OTAKU")
[VAR2] = OTP number (e.g., "123456")
```

#### **Important Template Rules**
- ✅ Use `[VAR1]`, `[VAR2]` etc. for variables
- ✅ Keep message under 160 characters
- ✅ Include clear purpose (OTP verification)
- ✅ Add validity information (5 minutes)
- ✅ Include security warning (don't share)
- ❌ No promotional content
- ❌ No special characters like #, %, &

### **2.3 Sample Templates for Different Use Cases**

#### **OTP Template**
```
Your OTP for [VAR1] is [VAR2]. Valid for [VAR3] minutes. Do not share with anyone. -[VAR4]

Variables:
[VAR1] = Service name
[VAR2] = OTP code
[VAR3] = Validity time
[VAR4] = Sender name
```

#### **Order Confirmation Template**
```
Your order [VAR1] has been confirmed for Rs.[VAR2]. Expected delivery: [VAR3]. Track: [VAR4] -[VAR5]

Variables:
[VAR1] = Order ID
[VAR2] = Amount
[VAR3] = Delivery date
[VAR4] = Tracking link
[VAR5] = Sender name
```

## 🔍 **Step 3: Template Submission Process**

### **3.1 Complete Template Form**
1. **Fill all required fields**
2. **Select appropriate category** (Service → OTP)
3. **Choose correct template type** (Service Explicit)
4. **Add sample message** with actual values:
   ```
   Sample: Your verification code for DESI OTAKU is 123456. Valid for 5 minutes. Do not share this OTP with anyone.
   ```

### **3.2 Submit for Approval**
1. **Review** all details carefully
2. **Click** "Submit Template"
3. **Note down** the Template ID (will be generated)
4. **Status**: Shows as "Pending Approval"

### **3.3 Approval Timeline**
- **Submission**: Instant
- **Initial Review**: 2-4 hours
- **Telecom Operator Approval**: 1-3 business days
- **Final Approval**: Email notification sent

## ✅ **Step 4: Get Your DLT Template ID**

### **4.1 Check Approval Status**
1. **Go to** DLT → Content Template
2. **Check Status** column:
   - 🟡 **Pending**: Under review
   - 🟢 **Approved**: Ready to use
   - 🔴 **Rejected**: Needs modification

### **4.2 Copy Template ID**
Once approved:
1. **Find your template** in the list
2. **Copy the Template ID** (e.g., `1207162127867533928`)
3. **This is your DLT Template ID** to use in API calls

### **4.3 Template ID Format**
```
Template ID: 1207162127867533928
Format: 19-digit number
Example Usage: MSG91_TEMPLATE_ID=1207162127867533928
```

## 🔧 **Step 5: Configure in Your Application**

### **5.1 Update Environment Variables**
Add to your `server/.env` file:
```bash
# MSG91 DLT Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=OTAKU1
MSG91_TEMPLATE_ID=1207162127867533928
MSG91_ROUTE=4
```

### **5.2 Update SMS Service Code**
```javascript
// server/services/smsService.js
const sendOTP = async (phone, otp) => {
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID;
  
  const smsData = {
    sender: senderId,
    route: "4",
    country: "91",
    sms: [{
      message: otp,
      to: [phone],
      template_id: templateId,
      VAR1: "DESI OTAKU",  // Brand name
      VAR2: otp            // OTP code
    }]
  };
  
  // Send SMS via MSG91 API
};
```

## 🧪 **Step 6: Testing Your DLT Template**

### **6.1 Test Message Format**
```javascript
// Test with actual template
const testMessage = {
  template_id: "1207162127867533928",
  VAR1: "DESI OTAKU",
  VAR2: "123456"
};

// Final message will be:
// "Your verification code for DESI OTAKU is 123456. Valid for 5 minutes. Do not share this OTP with anyone."
```

### **6.2 Verify Template Variables**
1. **Test with different values**:
   ```javascript
   VAR1: "Test Brand"     → Changes brand name
   VAR2: "987654"         → Changes OTP
   ```
2. **Check character limits**
3. **Verify SMS delivery**

## ❌ **Step 7: Common Issues & Solutions**

### **7.1 Template Rejection Reasons**

#### **Content Issues**
```
❌ Promotional content detected
Solution: Remove promotional keywords (offer, discount, free)

❌ Invalid variable format
Solution: Use [VAR1], [VAR2] format only

❌ Exceeds character limit
Solution: Keep under 160 characters
```

#### **Category Issues**
```
❌ Wrong category selected
Solution: Use Service → OTP for verification messages

❌ Missing mandatory fields
Solution: Fill all required template information
```

### **7.2 PE (Principal Entity) Issues**
```
❌ PE not approved
Solution: Complete PE registration first

❌ Missing documents
Solution: Upload all required business documents

❌ Invalid entity type
Solution: Select correct business entity type
```

### **7.3 API Integration Issues**
```javascript
// Error: Template ID not found
❌ template_id: "wrong_id"
✅ template_id: "1207162127867533928"

// Error: Variable mismatch
❌ VAR3: "extra_variable"
✅ Only use variables defined in template
```

## 📞 **Step 8: Support & Help**

### **8.1 MSG91 Support Channels**
- **Dashboard Chat**: Available 24/7
- **Email**: [help@msg91.com](mailto:help@msg91.com)
- **Phone**: Check dashboard for current number
- **WhatsApp**: Available through dashboard

### **8.2 Template Modification**
If you need to change your template:
1. **Cannot modify** approved templates
2. **Create new template** with changes
3. **Wait for approval** (1-3 days)
4. **Update Template ID** in your code

### **8.3 Emergency Alternatives**
If template approval is delayed:
1. **Use development mode** for testing
2. **Contact MSG91 support** for expedited approval
3. **Consider backup SMS provider** temporarily

## 📋 **Step 9: Checklist for DLT Template ID**

### **Before Starting**
- [ ] MSG91 account created and verified
- [ ] Business documents ready (GST, registration)
- [ ] Sender ID approved
- [ ] Principal Entity registered

### **Template Creation**
- [ ] Correct template type selected (Service Explicit)
- [ ] Appropriate category chosen (Service → OTP)
- [ ] Message under 160 characters
- [ ] Variables properly formatted [VAR1], [VAR2]
- [ ] No promotional content
- [ ] Clear purpose mentioned (OTP verification)
- [ ] Security warning included

### **After Approval**
- [ ] Template ID copied correctly
- [ ] Environment variables updated
- [ ] Code updated with template ID
- [ ] SMS service tested with template
- [ ] Variables tested with different values

## 📝 **Business Description for DLT Application**

### **Your Business Details for MSG91 Registration:**

**Business Name:** DESI OTAKU (Custom Anime T-Shirt Brand)

**Business Description:**
"We operate an e-commerce platform specializing in custom anime-themed apparel and merchandise. Our business focuses on providing high-quality custom t-shirts featuring anime designs, characters, and artwork to anime enthusiasts across India."

**Products We Sell:**
- Custom printed t-shirts with anime designs
- Pre-made anime character t-shirts
- Customizable apparel with user-uploaded designs
- Branded anime merchandise and accessories
- Limited edition anime series collections

**Business Category:** E-commerce/Retail - Apparel & Fashion

**Target Customers:**
- Anime enthusiasts aged 16-45
- Custom design creators and artists
- Gift buyers for anime fans
- College students and young professionals
- Online anime community members

**Business Channels:**
- **Primary:** E-commerce website (online platform)
- **Secondary:** Social media platforms (Instagram, Facebook, Twitter)
- **Future:** Mobile application
- **Support:** WhatsApp customer service, email support

**Business Operations:**
- Online order processing and customer management
- Custom design creation and approval workflow
- Payment processing through multiple gateways (Razorpay, Stripe, UPI)
- Order fulfillment and shipping across India
- Customer support and order tracking services

**SMS Use Cases:**
- Order confirmation notifications
- Payment verification OTPs
- Shipping and delivery updates
- Customer authentication codes
- Promotional offers to existing customers
- Customer support communications

**Annual Business Volume:**
- Expected 10,000+ orders annually
- 50,000+ SMS per month (estimated)
- Pan-India delivery operations

**Compliance Status:**
- GST registered business
- PCI DSS compliant payment processing
- GDPR-compliant data handling
- Industry-standard security measures

---

## 🎯 **Quick Reference**

### **Template ID Location**
```
Dashboard → DLT → Content Template → [Your Template] → Template ID column
```

### **API Usage**
```javascript
const smsData = {
  template_id: "1207162127867533928",  // Your DLT Template ID
  VAR1: "DESI OTAKU",                  // Brand name
  VAR2: otp                            // OTP code
};
```

### **Environment Variable**
```bash
MSG91_TEMPLATE_ID=1207162127867533928
```

## ✨ **Success! You Now Have DLT Template ID**

Once you complete these steps, you'll have:
- ✅ **Approved DLT Template ID** for SMS compliance
- ✅ **Legal SMS delivery** in India
- ✅ **High delivery rates** (95%+)
- ✅ **Professional SMS experience**
- ✅ **Regulatory compliance** with TRAI guidelines

**Your SMS service is now production-ready with full DLT compliance!**

---

**Need immediate help?** Contact MSG91 support through dashboard chat - they're available 24/7 for DLT-related queries.
