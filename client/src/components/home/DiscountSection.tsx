import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DiscountSectionProps {
  image: string;
  link: string;
  alt: string;
}

const DiscountSection: React.FC<DiscountSectionProps> = ({ image, link, alt }) => {
  const navigate = useNavigate();

  return (
    <section className="pt-1">
      <div className="w-[99%] mx-auto">
        <div
          onClick={() => navigate(link)}
        >
          <img
            src={image}
            alt={alt}
            className="w-full h-full object-cover"
          />
          {/* <div className="absolute inset-0 bg-black opacity-20 hover:opacity-0 transition-opacity duration-300"></div>
          <div className="absolute inset-0 flex items-center justify-center text-white text-center"> */}
            {/* You can add text overlay here if needed, similar to the original image */}
            {/* <h3 className="text-4xl font-black">CRAZY OFFERS</h3> */}
          {/* </div> */}
        </div>
      </div>
    </section>
  );
};

export default DiscountSection;
