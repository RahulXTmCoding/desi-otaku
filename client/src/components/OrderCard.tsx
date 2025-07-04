import React from "react";
import { Link } from "react-router-dom";
import { API } from "../backend";
import { Package } from "lucide-react";

const OrderCard = ({ order }) => {
  const getProductImage = (item: any) => {
    // Handle custom products
    if (item.isCustom || !item.product) {
      return null;
    }
    
    // Handle regular products
    if (item.product?.photoUrl) {
      return item.product.photoUrl;
    } else if (item.product?._id) {
      return `${API}/product/photo/${item.product._id}`;
    } else if (typeof item.product === 'string') {
      return `${API}/product/photo/${item.product}`;
    }
    
    return null;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors">
      <Link to={`/order/${order._id}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-bold">Order #{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-gray-400">Status: {order.status}</p>
          </div>
          <p className="text-lg font-bold text-yellow-400">₹{order.amount}</p>
        </div>
        <div className="mt-4">
          <p className="font-bold text-sm text-gray-300 mb-2">Products:</p>
          <div className="flex space-x-4 mt-2 overflow-x-auto">
            {order.products.map((item: any, index: number) => {
              const imageUrl = getProductImage(item);
              
              return (
                <div key={index} className="flex flex-col items-center min-w-[60px]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                    <Package className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-xs mt-1 text-center line-clamp-2 w-16">
                    {item.name} x {item.count || 1}
                  </p>
                  {item.isCustom && (
                    <span className="text-xs text-yellow-400 mt-1">Custom</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </Link>
    </div>
  );
};

export default OrderCard;
