import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/adaptive-logo.css';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-32  flex items-center justify-center overflow-hidden">
              <img src="/brand.png" alt="Attars Club Logo" className="w-32 object-contain logo-adaptive" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Your one-stop shop for premium fashion and contemporary designs.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Shop</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/shop?type=6866c0feb7d12a687483eff3" className="hover:text-yellow-400 transition-colors">
                Printed Tees
              </Link>
            </li>
            <li>
              <Link to="/shop?type=6866c0feb7d12a687483eff7" className="hover:text-yellow-400 transition-colors">
                Hoodies
              </Link>
            </li>
            <li>
              <Link to="/customize" className="hover:text-yellow-400 transition-colors">
                Custom Design
              </Link>
            </li>
            <li>
              <Link to="/mockup-studio" className="hover:text-yellow-400 transition-colors">
                Mock-up Studio
              </Link>
            </li>
            <li>
              <Link to="/shop?filter=new" className="hover:text-yellow-400 transition-colors">
                New Arrivals
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Customer Services</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/shipping-policy" className="hover:text-yellow-400 transition-colors">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link to="/return-policy" className="hover:text-yellow-400 transition-colors">
                Return and Replace Policy
              </Link>
            </li>
            <li>
              <Link to="/cancellation-policy" className="hover:text-yellow-400 transition-colors">
                Cancellation Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-yellow-400 transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-yellow-400 transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Support</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/contact" className="hover:text-yellow-400 transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/size-guide" className="hover:text-yellow-400 transition-colors">
                Size Guide
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Connect</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 transition-colors"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 transition-colors"
              >
                Twitter
              </a>
            </li>
            <li>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 transition-colors"
              >
                Discord
              </a>
            </li>
            <li>
              <Link to="/newsletter" className="hover:text-yellow-400 transition-colors">
                Newsletter
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
        <p>&copy; 2025 Attars Club. All rights reserved. Made with ❤️ for fashion enthusiasts.</p>
      </div>
    </footer>
  );
};

export default Footer;
