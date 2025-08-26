import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Database, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-gray-500 text-sm mt-2">Last updated: January 15, 2024</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview */}
          <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-400/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <Eye className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Privacy Overview</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Lock className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold text-green-400 mb-2">Secure</h3>
                <p className="text-gray-100 text-sm">Your data is encrypted and protected</p>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Database className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold text-blue-400 mb-2">Minimal</h3>
                <p className="text-gray-100 text-sm">We collect only what's necessary</p>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Globe className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold text-yellow-400 mb-2">Transparent</h3>
                <p className="text-gray-100 text-sm">Clear about how we use your data</p>
              </div>
            </div>
          </div>

          {/* Information We Collect */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">1. Information We Collect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-400">Personal Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Name and contact information (email, phone number)</li>
                  <li>• Shipping and billing addresses</li>
                  <li>• Payment information (processed securely by payment providers)</li>
                  <li>• Account credentials (username, encrypted password)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Usage Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Pages visited and time spent on our website</li>
                  <li>• Products viewed and purchased</li>
                  <li>• Search queries and preferences</li>
                  <li>• Device and browser information</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-400">Design Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Custom designs and artwork uploaded</li>
                  <li>• Design preferences and customizations</li>
                  <li>• Order specifications and requirements</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">2. How We Use Your Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Primary Uses</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Process and fulfill your orders</li>
                  <li>• Provide customer support</li>
                  <li>• Send order updates and confirmations</li>
                  <li>• Manage your account and preferences</li>
                  <li>• Process payments and refunds</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Secondary Uses</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Improve our products and services</li>
                  <li>• Personalize your shopping experience</li>
                  <li>• Send promotional offers (with consent)</li>
                  <li>• Analyze website usage and trends</li>
                  <li>• Prevent fraud and ensure security</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">3. Information Sharing</h2>
            <p className="text-gray-300 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li>• <strong>Service Providers:</strong> Shipping companies, payment processors, and other service providers necessary to fulfill orders</li>
              <li>• <strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li>• <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              <li>• <strong>Consent:</strong> When you explicitly consent to sharing</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">4. Data Security</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Technical Safeguards</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• SSL encryption for data transmission</li>
                  <li>• Secure servers and databases</li>
                  <li>• Regular security updates and patches</li>
                  <li>• Access controls and authentication</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Operational Safeguards</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Employee training on data protection</li>
                  <li>• Limited access on need-to-know basis</li>
                  <li>• Regular security audits and monitoring</li>
                  <li>• Incident response procedures</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cookies and Tracking */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">5. Cookies and Tracking</h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your browsing experience:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li>• <strong>Essential Cookies:</strong> Required for website functionality and security</li>
              <li>• <strong>Performance Cookies:</strong> Help us understand how visitors use our website</li>
              <li>• <strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li>• <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
            </ul>
            <p className="text-gray-300 mt-4">
              You can control cookies through your browser settings, but some features may not work properly if disabled.
            </p>
          </div>

          {/* Your Rights */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">6. Your Privacy Rights</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Access & Control</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Access your personal data</li>
                  <li>• Update or correct information</li>
                  <li>• Delete your account and data</li>
                  <li>• Export your data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Communication Preferences</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Opt out of marketing emails</li>
                  <li>• Control notification settings</li>
                  <li>• Manage cookie preferences</li>
                  <li>• Request data portability</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">7. Data Retention</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• Account information: Retained while your account is active</li>
              <li>• Order history: Kept for 7 years for tax and legal compliance</li>
              <li>• Payment information: Not stored on our servers (handled by payment processors)</li>
              <li>• Marketing data: Retained until you opt out or request deletion</li>
              <li>• Website analytics: Anonymized data retained for business analysis</li>
            </ul>
          </div>

          {/* Third-Party Services */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">8. Third-Party Services</h2>
            <p className="text-gray-300 mb-4">
              We use trusted third-party services to provide our services:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Payment Processing</h3>
                <p className="text-gray-300 text-sm">Razorpay, Stripe (PCI DSS compliant)</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Shipping Partners</h3>
                <p className="text-gray-300 text-sm">Delhivery, Blue Dart, Ekart</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Analytics</h3>
                <p className="text-gray-300 text-sm">Google Analytics (anonymized)</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Email Services</h3>
                <p className="text-gray-300 text-sm">Trusted email service providers</p>
              </div>
            </div>
          </div>

          {/* Changes to Policy */}
          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">9. Changes to This Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>• Posting the updated policy on our website</li>
              <li>• Sending an email notification to registered users</li>
              <li>• Displaying a prominent notice on our website</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Your continued use of our services after any changes constitutes acceptance of the updated policy.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-white">Contact Us About Privacy</h2>
            <p className="text-white mb-6">
              If you have any questions about this Privacy Policy or how we handle your data, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Privacy Contact
              </Link>
              <Link 
                to="/terms-of-service" 
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
