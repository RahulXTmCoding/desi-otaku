import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">👕</span>
            </div>
            <span className="text-xl font-bold text-white">Otakool</span>
          </div>
          <p className="text-gray-400 text-sm">
            Your one-stop shop for custom otakool t-shirts and premium designs.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Shop</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/shop?category=anime" className="hover:text-yellow-400 transition-colors">
                Otakool Collection
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
        <p>&copy; 2024 Otakool. All rights reserved. Made with ❤️ for anime fans.</p>
      </div>
    </footer>
  );
};

export default Footer;
