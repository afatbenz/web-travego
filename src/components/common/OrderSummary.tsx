import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

interface OrderSummaryProps {
  title: string;
  image: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  total: number;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  title,
  image,
  items,
  subtotal,
  discount = 0,
  total,
  className = ''
}) => {
  return (
    <Card className={`sticky top-6 ${className}`}>
      <CardHeader>
        <CardTitle>Ringkasan Pesanan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Item Summary */}
        <div className="flex items-center space-x-3">
          <img
            src={image}
            alt={title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {items.length} item{items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {item.name} x{item.quantity}
              </span>
              <div className="text-right">
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="text-xs text-gray-400 line-through">
                    Rp {item.originalPrice.toLocaleString()}
                  </div>
                )}
                <span className="font-medium">
                  Rp {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Diskon</span>
              <span className="text-green-600">-Rp {discount.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Total</span>
            <span>Rp {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Pembayaran:</strong> Transfer Bank atau QRIS
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Konfirmasi pembayaran akan dikirim via email
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
