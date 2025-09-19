import React from "react";
import { Link } from "react-router-dom";
import { API } from "../backend";
import { Package } from "lucide-react";
import CartTShirtPreview from "./CartTShirtPreview";

const OrderCard = ({ order }) => {
  // ✅ ENHANCED: Comprehensive image resolution with multiple fallback strategies
  const getProductImage = (item: any) => {
    // Strategy 1: Direct photoUrl from product object
    if (item.product && typeof item.product === 'object' && item.product.photoUrl) {
      return item.product.photoUrl;
    }

    // Strategy 2: Product object with _id
    if (item.product && typeof item.product === 'object' && item.product._id) {
      const imageUrl = `${API}/product/image/${item.product._id}/0`;
      return imageUrl;
    }

    // Strategy 3: Product as string ID
    if (typeof item.product === 'string' && item.product) {
      const imageUrl = `${API}/product/image/${item.product}/0`;
      return imageUrl;
    }

    // Strategy 4: Direct productId field
    if (item.productId) {
      const imageUrl = `${API}/product/image/${item.productId}/0`;
      return imageUrl;
    }

    // Strategy 5: Item level photoUrl
    if (item.photoUrl) {
      return item.photoUrl;
    }

    // Strategy 6: Try to extract from name-based pattern
    if (item.name && !item.isCustom && !item.customization) {
      // Some items might have product reference embedded in name or other fields
    }

    return null;
  };

  // ✅ FIXED: Correct custom product detection - trust the isCustom flag
  const isCustomProduct = (item: any) => {
    
    // ✅ CRITICAL FIX: Trust the isCustom flag as the definitive answer
    if (item.isCustom === true) {
      return true;
    }
    
    if (item.isCustom === false) {
      return false;
    }

    // ✅ FALLBACK: Only use other indicators if isCustom is not explicitly set
    // This handles legacy data where isCustom might be undefined
    if (item.product === null && (item.designId || item.customDesign)) {
      return true;
    }

    // ✅ DEFAULT: If no clear indicators, assume regular product
    return false;
  };

  return (
    <div className="bg-gray-800 p-3 md:p-4 rounded-lg hover:bg-gray-750 transition-colors">
      <Link to={`/order/${order._id}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div className="flex-1">
            <p className="text-base md:text-lg font-bold break-all sm:break-normal">Order #{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-xs md:text-sm text-gray-400">Status: {order.status}</p>
          </div>
          <p className="text-lg md:text-xl font-bold text-yellow-400 text-right">₹{order.amount}</p>
        </div>
        <div className="mt-3 md:mt-4">
          <p className="font-bold text-xs md:text-sm text-gray-300 mb-2">Products:</p>
          <div className="flex space-x-2 md:space-x-4 mt-2 overflow-x-auto pb-2">
        {order.products.map((item: any, index: number) => {
          
          
          const isCustom = isCustomProduct(item);
          
          let imageUrl = null;
          if (!isCustom) {
            imageUrl = getProductImage(item);
          }
          
          return (
                <div key={index} className="flex flex-col items-center min-w-[60px]">
                  {isCustom ? (
                    <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden">
                      <CartTShirtPreview
                        design={item.customDesign || item.name}
                        color={item.color || item.selectedColor || "White"}
                        colorValue={item.colorValue || item.selectedColorValue || "#FFFFFF"}
                        customization={item.customization}
                      />
                    </div>
                  ) : imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling;
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                        onLoad={() => {
                        }}
                      />
                      <div className="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center" style={{ display: 'none' }}>
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                    </>
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <p className="text-xs mt-1 text-center line-clamp-2 w-16">
                    {item.name} x {item.count || 1}
                  </p>
                  {isCustom && (
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
