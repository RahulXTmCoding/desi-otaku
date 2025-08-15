import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, Shield } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Terms of Service</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Scale className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Terms of Service
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Please read these terms carefully before using our services
          </p>
          <p className="text-gray-500 text-sm mt-2">Last updated: January 15, 2024</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Overview</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                This website is operated by <strong>Attars Clothing</strong>. Throughout the site, the terms "we", "us" and "our" refer to Attars Clothing. 
                Attars offers this website, including all information, tools and services available from this site to you, the user, conditioned upon 
                your acceptance of all terms, conditions, policies and notices stated here.
              </p>
              <p>
                By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and 
                conditions ("Terms of Service", "Terms"), including those additional terms and conditions and policies referenced herein and/or available by hyperlink.
              </p>
              <p>
                Please read these Terms of Service carefully before accessing or using our website. By accessing or using any part of the site, you agree 
                to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the 
                website or use any services.
              </p>
            </div>
          </div>

          {/* Section 1 - Online Store Terms */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 1 - Online Store Terms</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• You represent that you are at least the age of majority in your state or province of residence</li>
              <li>• You may not use our products for any illegal or unauthorized purpose</li>
              <li>• You must not transmit any worms or viruses or any code of a destructive nature</li>
              <li>• A breach or violation of any of the Terms will result in immediate termination of your Services</li>
            </ul>
          </div>

          {/* Section 2 - General Conditions */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 2 - General Conditions</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• We reserve the right to refuse service to anyone for any reason at any time</li>
              <li>• Your content (not including credit card information), may be transferred unencrypted</li>
              <li>• Credit card information is always encrypted during transfer over networks</li>
              <li>• You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without express written permission</li>
            </ul>
          </div>

          {/* Section 3 - Product Information */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 3 - Product Information</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is 
                provided for general information only and should not be relied upon as the sole basis for making decisions.
              </p>
              <p>
                We have made every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your 
                computer monitor's display of any color will be accurate.
              </p>
            </div>
          </div>

          {/* Section 4 - Products and Services */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 4 - Products and Services</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• Certain products may be available exclusively online through the website</li>
              <li>• Products may have limited quantities and are subject to return or exchange according to our Return Policy</li>
              <li>• We reserve the right to limit sales of our products to any person, geographic region or jurisdiction</li>
              <li>• All product descriptions and pricing are subject to change at any time without notice</li>
              <li>• We reserve the right to discontinue any product at any time</li>
            </ul>
          </div>

          {/* Section 5 - Billing and Account Information */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 5 - Billing and Account Information</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We reserve the right to refuse any order you place with us. We may limit or cancel quantities purchased per person, per household 
                or per order. These restrictions may include orders placed by the same customer account, credit card, and/or billing address.
              </p>
              <p>
                You agree to provide current, complete and accurate purchase and account information for all purchases. You agree to promptly update 
                your account information so that we can complete your transactions and contact you as needed.
              </p>
            </div>
          </div>

          {/* Section 6 - Returns and Refunds */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 6 - Returns and Refunds</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-yellow-400">Returns:</h3>
              <p>
                Customers can return their products within <strong>7 days</strong> of delivery through our website. To initiate the return process, 
                customers must contact our customer support team and provide the order number, reason for return, and photo proof of the product 
                in its original condition.
              </p>
              
              <h3 className="text-lg font-semibold text-yellow-400">Refunds:</h3>
              <p>
                Refunds will be processed to the original payment method within 5-7 business days of receiving and verifying the returned product. 
                If the product is damaged during shipping, a replacement can be provided.
              </p>
              
              <p>
                For more details, please review our <Link to="/return-policy" className="text-yellow-400 hover:underline">Return Policy</Link>.
              </p>
            </div>
          </div>

          {/* Section 7 - User Comments and Feedback */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 7 - User Comments and Feedback</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                If you send us creative ideas, suggestions, proposals, or other materials, you agree that we may use them without restriction. 
                We are under no obligation to maintain any comments in confidence or pay compensation for any comments.
              </p>
              <p>
                You agree that your comments will not violate any third-party rights, including copyright, trademark, or privacy rights. 
                Comments must not contain unlawful, abusive, or obscene material.
              </p>
            </div>
          </div>

          {/* Section 8 - Prohibited Uses */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 8 - Prohibited Uses</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-400">You are prohibited from using the site:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• For any unlawful purpose</li>
                  <li>• To violate any laws or regulations</li>
                  <li>• To infringe upon intellectual property rights</li>
                  <li>• To harass, abuse, or discriminate</li>
                  <li>• To submit false or misleading information</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-400">Additional Restrictions:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Upload viruses or malicious code</li>
                  <li>• Collect personal information of others</li>
                  <li>• Spam, phish, or scrape content</li>
                  <li>• Interfere with security features</li>
                  <li>• Use for obscene or immoral purposes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 9 - Disclaimer and Limitation of Liability */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-4 sm:p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Section 9 - Disclaimer and Limitation of Liability</h2>
            </div>
            <div className="space-y-4 text-white">
              <p>
                We do not guarantee that your use of our service will be uninterrupted, timely, secure or error-free. The service and all products 
                are provided 'as is' and 'as available' without any warranties.
              </p>
              <p>
                <strong>In no case shall Attars Clothing, our directors, officers, employees, or affiliates be liable for any direct, indirect, 
                incidental, punitive, special, or consequential damages</strong> arising from your use of the service, even if advised of their possibility.
              </p>
            </div>
          </div>

          {/* Section 10 - Indemnification */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 10 - Indemnification</h2>
            <p className="text-gray-300">
              You agree to indemnify, defend and hold harmless Attars Clothing and our affiliates, officers, directors, agents, and employees 
              from any claim or demand made by any third-party due to your breach of these Terms of Service or your violation of any law or rights of a third-party.
            </p>
          </div>

          {/* Section 11 - Termination */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 11 - Termination</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                These Terms of Service are effective unless terminated by either you or us. You may terminate these Terms at any time by notifying 
                us that you no longer wish to use our Services.
              </p>
              <p>
                If you fail to comply with any term of these Terms of Service, we may terminate this agreement at any time without notice and you 
                will remain liable for all amounts due up to the date of termination.
              </p>
            </div>
          </div>

          {/* Section 12 - Governing Law */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 12 - Governing Law</h2>
            <p className="text-gray-300">
              These Terms of Service shall be governed by and construed in accordance with the <strong>laws of India</strong>. Any disputes will be 
              subject to the exclusive jurisdiction of the courts in India.
            </p>
          </div>

          {/* Section 13 - Changes to Terms */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-yellow-400">Section 13 - Changes to Terms of Service</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We reserve the right to update, change or replace any part of these Terms of Service by posting updates to our website. It is your 
                responsibility to check our website periodically for changes.
              </p>
              <p>
                Your continued use of our website following the posting of any changes constitutes acceptance of those changes.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-4 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">Contact Information</h2>
            <div className="space-y-4 text-white">
              <p>
                Questions about the Terms of Service should be sent to us at:
              </p>
              <div className="bg-gray-800 rounded-lg p-4 inline-block">
                <p className="font-semibold text-yellow-400">hello@attars.club</p>
              </div>
              <div className="pt-4">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
