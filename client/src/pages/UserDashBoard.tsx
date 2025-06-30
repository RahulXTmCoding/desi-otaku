import React from "react";

const UserDashBoard = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">User Dashboard</h1>
      <div className="bg-gray-900 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">User Information</h2>
        <p>Welcome to your dashboard. Here you can view your profile and order history.</p>
      </div>
    </div>
  );
};

export default UserDashBoard;
