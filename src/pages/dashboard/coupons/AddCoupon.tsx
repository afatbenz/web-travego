import React from 'react';

export const AddCoupon: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Coupon</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Create a new coupon</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-300">Coupon creation form will appear here.</p>
      </div>
    </div>
  );
};
