import React from "react";

interface BaseProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

const Base: React.FC<BaseProps> = ({
  title = "My Title",
  description = "",
  className = "bg-gray-900 text-white",
  children,
}) => (
  <div>
    {(title || description) && (
      <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-gray-900 text-white text-center md:pt-8 pt-4">
        <h2 className="text-4xl font-bold">{title}</h2>
        <p className="text-xl text-gray-300 mt-2">{description}</p>
      </div>
    )}
    <div className={className}>{children}</div>
  </div>
);

export default Base;
