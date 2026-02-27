import React from 'react';

export const AllCustomers: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Customers</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage all customers</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-300">No customer data available.</p>
      </div>
    </div>
  );
};
