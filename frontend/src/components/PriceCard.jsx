import React from "react";

export default function PriceCard({ name, price }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center w-64">
      <h2 className="text-xl font-semibold">{name}</h2>
      <span className="text-green-400 text-lg">${price ?? "..."}</span>
    </div>
  );
}
