import React from "react";
import { Link } from "react-router-dom";

const OrderCard = ({ order }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <Link to={`/order/${order._id}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-bold">Order ID: {order._id}</p>
            <p className="text-sm text-gray-400">Status: {order.status}</p>
          </div>
          <p className="text-lg font-bold">${order.amount}</p>
        </div>
        <div className="mt-4">
          <p className="font-bold">Products:</p>
          <div className="flex space-x-4 mt-2">
            {order.products.map((item: any) => (
              <div key={item.product._id} className="flex flex-col items-center">
                <img
                  src={item.product.photoUrl}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <p className="text-sm mt-1">{item.name} x {item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default OrderCard;
