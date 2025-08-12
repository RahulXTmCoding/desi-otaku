import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden">
              <img src="/logo512.png" alt="Attars Clothing Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
              Attars
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Your one-stop shop for premium fashion and contemporary designs.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Shop</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/shop?category=fashion" className="hover:text-yellow-400 transition-colors">
                Fashion Collection
              </Link>
            </li>
            <li>
              <Link to="/shop?category=brand" className="hover:text-yellow-400 transition-colors">
                Brand Designs
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
            <li>
              <Link to="/shipping" className="hover:text-yellow-400 transition-colors">
                Shipping Info
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-yellow-400 transition-colors">
                Returns
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
        <p>&copy; 2024 Attars Clothing. All rights reserved. Made with ❤️ for fashion enthusiasts.</p>
      </div>
    </footer>
  );
};

export default Footer;
