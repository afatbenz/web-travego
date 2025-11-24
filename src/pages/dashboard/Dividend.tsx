import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dividend() {
  const dividendData = [
    { id: 1, month: 'March 2024', amount: 15000, growth: 12.5 },
    { id: 2, month: 'February 2024', amount: 13500, growth: -2.3 },
    { id: 3, month: 'January 2024', amount: 14000, growth: 5.8 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dividend Overview</h1>
        <p className="text-gray-600">Track and manage your dividend payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Dividend</p>
              <h2 className="text-3xl font-bold">$42,500</h2>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+5.25% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Average Monthly</p>
              <h2 className="text-3xl font-bold">$14,167</h2>
            </div>
            <div className="bg-secondary/10 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+2.1% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Projected Annual</p>
              <h2 className="text-3xl font-bold">$170,000</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+8.3% from last year</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Growth
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dividendData.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.growth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    <span>{Math.abs(item.growth)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}