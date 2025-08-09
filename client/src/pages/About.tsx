import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Award, Palette, Users, Sparkles, Star, CheckCircle, ArrowRight, Zap, Target, Eye } from 'lucide-react';
import Base from '../core/Base';

const About: React.FC = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion-Driven",
      description: "Every design is crafted with genuine love for fashion culture and contemporary style",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Premium Quality",
      description: "We use only the finest materials and printing techniques for lasting comfort",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Creative Excellence",
      description: "Our in-house design team creates unique, eye-catching fashion pieces",
      color: "from-purple-500 to-blue-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community First",
      description: "Built by fashion enthusiasts, for fashion lovers - we understand what style conscious people truly want",
      color: "from-green-500 to-teal-500"
    }
  ];

  const features = [
    { icon: <CheckCircle className="w-6 h-6" />, text: "100% Premium Cotton Fabric" },
    { icon: <CheckCircle className="w-6 h-6" />, text: "High-Definition Print Quality" },
    { icon: <CheckCircle className="w-6 h-6" />, text: "Fade-Resistant Colors" },
    { icon: <CheckCircle className="w-6 h-6" />, text: "Perfect Fit Guarantee" },
    { icon: <CheckCircle className="w-6 h-6" />, text: "Eco-Friendly Printing Process" },
    { icon: <CheckCircle className="w-6 h-6" />, text: "Custom Design Options" }
  ];

  const stats = [
    { number: "50,000+", label: "Happy Customers", icon: <Users className="w-6 h-6" /> },
    { number: "500+", label: "Unique Designs", icon: <Palette className="w-6 h-6" /> },
    { number: "99.5%", label: "Quality Rating", icon: <Star className="w-6 h-6" /> },
    { number: "24/7", label: "Customer Support", icon: <Heart className="w-6 h-6" /> }
  ];

  return (
    <Base title="About Us - Attars Clothing" description="Learn about our passion for delivering high-quality fashion and exceptional designs">
      <div className="min-h-screen">
        
        {/* Hero Section - Always dark background with white text */}
        <section className="relative py-20 overflow-hidden bg-black">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 grid grid-cols-6 gap-4">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-60 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>

          <div className="relative w-[96%] mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 px-6 py-3 rounded-full mb-8 shadow-lg">
              <Sparkles className="w-5 h-5 text-black" />
              <span className="text-black font-black">About Attars Clothing</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-8 leading-tight text-white">
              Where
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Fashion Meets
              </span>
              <span className="block bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
                Excellence
              </span>
            </h1>
            
            <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed font-bold text-white">
              We're not just another clothing brand. We're a community of fashion enthusiasts dedicated to bringing you 
              the highest quality apparel with designs that truly capture the essence of contemporary style.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => navigate('/shop')}
                className="bg-yellow-400 text-black px-8 py-4 rounded-full font-black hover:bg-yellow-300 transition-all transform hover:scale-105 flex items-center gap-2 justify-center shadow-lg"
              >
                <span>Explore Our Collection</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/customize')}
                className="border-2 border-purple-400 text-purple-400 bg-black px-8 py-4 rounded-full font-black hover:bg-purple-400 hover:text-black transition-all flex items-center gap-2 justify-center"
              >
                <Palette className="w-5 h-5" />
                <span>Create Custom Design</span>
              </button>
            </div>
          </div>
        </section>

        {/* Mission & Vision - White background with black text */}
        <section className="py-20 bg-white">
          <div className="w-[96%] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Mission */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-black">Our Mission</h2>
                </div>
                <p className="text-lg leading-relaxed font-bold text-black bg-gray-100 p-6 rounded-2xl">
                  To revolutionize contemporary fashion by delivering premium quality apparel that lets every style enthusiast express their 
                  personality with pride. We believe that fashion is not just about clothing—it's a lifestyle, and your wardrobe 
                  should reflect that commitment to excellence.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-100 p-4 rounded-xl border-2 border-yellow-400">
                    <Zap className="w-6 h-6 text-yellow-600 mb-2" />
                    <h4 className="font-black mb-1 text-black">Innovation</h4>
                    <p className="text-sm font-bold text-gray-700">Cutting-edge printing technology</p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-xl border-2 border-orange-400">
                    <Star className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-black mb-1 text-black">Excellence</h4>
                    <p className="text-sm font-bold text-gray-700">Uncompromising quality standards</p>
                  </div>
                </div>
              </div>

              {/* Vision */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-lg">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-black">Our Vision</h2>
                </div>
                <p className="text-lg leading-relaxed font-bold text-black bg-gray-100 p-6 rounded-2xl">
                  To become India's most beloved premium fashion brand, known for our unwavering commitment to quality, 
                  innovative designs, and deep understanding of contemporary style. We envision a world where every fashion 
                  enthusiast can wear their individuality confidently.
                </p>
                <div className="bg-purple-100 p-6 rounded-2xl border-2 border-purple-400">
                  <blockquote className="text-lg italic text-purple-700 font-bold">
                    "Quality is not just about the fabric we use—it's about the style we help you express."
                  </blockquote>
                  <cite className="block mt-4 text-sm font-bold text-black">— Attars Clothing Founders</cite>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values - Dark background with white text */}
        <section className="py-20 bg-gray-900">
          <div className="w-[96%] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-6 text-white">What Drives Us</h2>
              <p className="text-xl max-w-3xl mx-auto font-bold text-white">
                Our core values shape every decision we make, from design conception to customer delivery
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="group relative">
                  <div className="bg-white p-8 rounded-3xl h-full transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${value.color} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <div className="text-white">
                        {value.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-4 text-black">{value.title}</h3>
                    <p className="leading-relaxed font-bold text-gray-700">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quality Promise - White background */}
        <section className="py-20 bg-white">
          <div className="w-[96%] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-full shadow-lg">
                    <Award className="w-5 h-5 text-black" />
                    <span className="text-black font-black">Quality Promise</span>
                  </div>
                  <h2 className="text-4xl font-black leading-tight text-black">
                    Uncompromising Standards, 
                    <span className="block text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
                      Exceptional Results
                    </span>
                  </h2>
                  <p className="text-lg leading-relaxed font-bold text-black bg-gray-100 p-6 rounded-2xl">
                    We don't just make t-shirts; we craft experiences. Every thread, every print, every stitch is meticulously 
                    planned and executed to deliver apparel that exceeds expectations and stands the test of time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-100 rounded-lg border-2 border-green-400">
                      <div className="text-green-600 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <span className="font-bold text-black">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-100 p-6 rounded-2xl border-2 border-blue-400">
                  <h4 className="font-black text-blue-700 mb-2 text-lg">Our Quality Guarantee</h4>
                  <p className="font-bold text-black">
                    Not satisfied with your order? We offer hassle-free returns within 30 days. 
                    Your happiness is our success metric.
                  </p>
                </div>
              </div>

              {/* Visual */}
              <div className="relative">
                <div className="relative bg-gradient-to-br from-yellow-100 to-orange-100 p-8 rounded-3xl border-2 border-yellow-400">
                  <img 
                    src="https://fansarmy.in/cdn/shop/products/onepiecetshirt_1800x1800.jpg?v=1634797894"
                    alt="High Quality T-Shirt"
                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-2xl shadow-lg">
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold">A+</div>
                      <div className="text-sm">Quality Grade</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Black background */}
        <section className="py-20 bg-black">
          <div className="w-[96%] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-6 text-white">Numbers That Speak</h2>
              <p className="text-xl font-bold text-white">Our journey in numbers - proof of our commitment to excellence</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-white p-8 rounded-3xl hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl">
                    <div className="text-yellow-500 mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="font-bold text-black">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
          <div className="w-[96%] mx-auto text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 bg-yellow-400 px-6 py-3 rounded-full shadow-lg">
                <Sparkles className="w-5 h-5 text-black" />
                <span className="text-black font-black">Join Our Community</span>
              </div>
              
              <h2 className="text-4xl lg:text-6xl font-black leading-tight text-white">
                Ready to Wear Your
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Style?
                </span>
              </h2>
              
              <p className="text-xl text-white max-w-2xl mx-auto font-bold">
                Join thousands of satisfied customers who trust Attars Clothing for premium fashion. 
                Your journey to exceptional style starts here.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <button 
                  onClick={() => navigate('/shop')}
                  className="bg-yellow-400 text-black px-10 py-4 rounded-full font-black hover:bg-yellow-300 transition-all transform hover:scale-105 flex items-center gap-3 justify-center text-lg shadow-xl"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => navigate('/contact')}
                  className="border-2 border-white bg-white/20 text-white px-10 py-4 rounded-full font-black hover:bg-white/30 transition-all flex items-center gap-3 justify-center text-lg"
                >
                  <Heart className="w-6 h-6" />
                  <span>Get in Touch</span>
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Base>
  );
};

export default About;
