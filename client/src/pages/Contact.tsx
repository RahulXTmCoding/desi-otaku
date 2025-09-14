import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare,
  Clock,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const subject = encodeURIComponent(`Contact Form: ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Subject: ${formData.subject}\n\n` +
      `Message:\n${formData.message}`
    );
    
    // Open email client with pre-filled data
    window.location.href = `mailto:hello@attars.club?subject=${subject}&body=${body}`;
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    
    alert('Thank you for contacting us! Your email client will open with your message pre-filled.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 md:py-12">
      <div className="w-[96%] md:w-[90%] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Get in
            <span className="text-yellow-400"> Touch</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            Have questions about your order or custom designs? We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Form */}
          <div className="bg-gray-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-yellow-400" />
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
            
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold mb-4">You can also contact us for:</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span>
                    <strong>Bulk Orders:</strong> Planning an event or need a large quantity? We offer special pricing for bulk purchases.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span>
                    <strong>Custom Design Prints:</strong> Have a unique idea? We can print your custom designs on our high-quality t-shirts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span>
                    <strong>Returns & Exchanges:</strong> Questions about a return or need to exchange an item? Our team is here to assist you.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 md:space-y-8">
            {/* Contact Details */}
            <div className="bg-gray-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-gray-300">hello@attars.club</p>
                    {/* <p className="text-gray-300">support@attars.club</p> */}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-gray-300">+91 8707339611</p>
                    <p className="text-gray-300">+91 8299716657</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-gray-300">
                      s76 siddheshwar nagar,<br />
                      Near iti college,<br />
                      Jhansi, UP 284003
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-300">Monday - Friday: 10AM - 8PM</p>
                    <p className="text-gray-300">Saturday: 10AM - 6PM</p>
                    <p className="text-gray-300">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-6">Follow Us</h2>
              <div className="flex gap-4">
                <a
                  href="http://instagram.com/attars.club/"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors transform hover:scale-110"
                >
                  <Instagram className="w-6 h-6 text-yellow-400" />
                </a>
                <a
                  href="https://x.com/Attars_club"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors transform hover:scale-110"
                >
                  <Twitter className="w-6 h-6 text-yellow-400" />
                </a>
                <a
                  href="https://www.facebook.com/people/Attarsclub/61580543308343/"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors transform hover:scale-110"
                >
                  <Facebook className="w-6 h-6 text-yellow-400" />
                </a>
              </div>
              <p className="text-gray-300 mt-4">
                Stay connected for exclusive designs and offers!
              </p>
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 md:p-8 border border-gray-700">
              <h3 className="text-lg md:text-xl font-bold mb-4">Frequently Asked Questions</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>How long does shipping take?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Can I track my order?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>What's your return policy?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Do you ship internationally?</span>
                </li>
              </ul>
              <button className="mt-4 text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                View all FAQs →
              </button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-8 md:mt-12 bg-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6 text-yellow-400" />
            Find Us
          </h2>
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.0386574356767!2d78.5501969!3d25.4703846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39777116149259b3%3A0xb149a258a2e4a067!2sSai%20cyber%20cafe!5e0!3m2!1sen!2sin!4v1757872827657!5m2!1sen!2sin"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Attars Club Location - Jhansi, UP"
            ></iframe>
          </div>
          <div className="mt-4 text-center">
            <a
              href="https://maps.app.goo.gl/zVxG2e3k7GtZpvxd8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
