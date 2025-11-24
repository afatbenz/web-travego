import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, Clock, CheckCircle, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample data - in real app, this would come from API
const sampleOrderData = {
  id: "ORD-2024-001",
  type: "catalog", // or "armada"
  title: "Thailand Bangkok Tour Package - 4 Days 3 Nights",
  price: "Rp 2.500.000",
  totalPrice: "Rp 5.000.000",
  participants: 2,
  orderDate: "2024-01-15",
  paymentDeadline: "2024-01-17"
};

const bankTransferData = {
  bankName: "BCA",
  accountNumber: "1234567890",
  accountName: "PT TRAVEGO INDONESIA",
  amount: "Rp 5.000.000",
  transferCode: "123456"
};

const qrisData = {
  qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_PAYMENT_123456789",
  amount: "Rp 5.000.000",
  merchantName: "TRAVEGO"
};

export const Payment: React.FC = () => {
  const { type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  
  // In real app, fetch data based on id and type
  const orderData = sampleOrderData;
  const [selectedPayment, setSelectedPayment] = useState<'bank' | 'qris'>('bank');
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankTransferData.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTransferCode = () => {
    navigator.clipboard.writeText(bankTransferData.transferCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentComplete = () => {
    // In real app, this would submit payment proof
    alert('Pembayaran berhasil! Tim kami akan memverifikasi pembayaran Anda.');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentDeadline = () => {
    const deadline = new Date(orderData.paymentDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} hari lagi`;
    } else {
      return 'Hari ini';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pembayaran
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Section */}
          <div className="lg:col-span-2">
            {/* Order Summary */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Ringkasan Pesanan
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Nomor Pesanan</span>
                    <span className="font-medium text-gray-900 dark:text-white">{orderData.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tanggal Pesanan</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(orderData.orderDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Item</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                      {orderData.title}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Jumlah Peserta</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {orderData.participants} orang
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Harga per {type === 'catalog' ? 'pax' : 'hari'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {orderData.price}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Pembayaran</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {orderData.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Pilih Metode Pembayaran
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Transfer Option */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPayment === 'bank'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedPayment('bank')}
                  >
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Transfer Bank
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Transfer ke BCA
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      • Instan • Tanpa biaya admin
                    </div>
                  </div>

                  {/* QRIS Option */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPayment === 'qris'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedPayment('qris')}
                  >
                    <div className="flex items-center mb-3">
                      <QrCode className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          QRIS
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Scan QR Code
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      • Instan • Tanpa biaya admin
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {selectedPayment === 'bank' ? (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Instruksi Transfer Bank
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Bank Details */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Detail Rekening
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Bank</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {bankTransferData.bankName}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">Nomor Rekening</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white font-mono">
                              {bankTransferData.accountNumber}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyAccount}
                              className="h-8 w-8 p-0"
                            >
                              {copied ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Atas Nama</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {bankTransferData.accountName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Amount */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Jumlah Transfer
                      </h3>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {bankTransferData.amount}
                      </div>
                    </div>

                    {/* Transfer Code */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Kode Transfer
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-mono text-yellow-800 dark:text-yellow-200">
                          {bankTransferData.transferCode}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyTransferCode}
                          className="h-8 w-8 p-0"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                        *Wajib mencantumkan kode transfer ini pada keterangan transfer
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Cara Transfer:
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>Buka aplikasi mobile banking atau ATM</li>
                        <li>Pilih menu transfer ke rekening lain</li>
                        <li>Masukkan nomor rekening BCA: <span className="font-mono font-semibold">{bankTransferData.accountNumber}</span></li>
                        <li>Masukkan jumlah transfer: <span className="font-semibold">{bankTransferData.amount}</span></li>
                        <li>Masukkan kode transfer pada keterangan: <span className="font-mono font-semibold">{bankTransferData.transferCode}</span></li>
                        <li>Konfirmasi dan selesaikan transfer</li>
                        <li>Simpan bukti transfer untuk konfirmasi</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Instruksi Pembayaran QRIS
                  </h2>
                  
                  <div className="space-y-6">
                    {/* QR Code */}
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                        <img
                          src={qrisData.qrCode}
                          alt="QR Code Payment"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Scan QR Code dengan aplikasi mobile banking atau e-wallet
                      </p>
                    </div>

                    {/* Payment Amount */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Jumlah Pembayaran
                      </h3>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {qrisData.amount}
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                        Merchant: {qrisData.merchantName}
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Cara Pembayaran:
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>Buka aplikasi mobile banking atau e-wallet</li>
                        <li>Pilih menu scan QR Code</li>
                        <li>Scan QR Code yang ditampilkan</li>
                        <li>Periksa detail pembayaran (jumlah dan merchant)</li>
                        <li>Konfirmasi dan selesaikan pembayaran</li>
                        <li>Simpan bukti pembayaran untuk konfirmasi</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Confirmation */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Konfirmasi Pembayaran
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Setelah melakukan pembayaran, silakan upload bukti pembayaran untuk mempercepat proses verifikasi.
                  </p>
                  
                  <div className="flex space-x-4">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Upload Bukti Pembayaran
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handlePaymentComplete}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Konfirmasi Pembayaran
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Payment Deadline */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="h-5 w-5 text-orange-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Batas Waktu Pembayaran
                    </h3>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {getPaymentDeadline()}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Sampai {formatDate(orderData.paymentDeadline)}
                    </p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      ⚠️ Pesanan akan otomatis dibatalkan jika pembayaran tidak dilakukan dalam batas waktu yang ditentukan.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Status Pembayaran
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Pesanan</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Dikonfirmasi
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Pembayaran</span>
                      <Badge variant="outline" className="border-orange-300 text-orange-600">
                        Menunggu Pembayaran
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Support */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Butuh Bantuan?
                  </h3>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Jika mengalami kesulitan dalam proses pembayaran, hubungi customer service kami.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300 w-16">WhatsApp:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          +62 812-3456-7890
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300 w-16">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          support@travego.com
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      Hubungi Customer Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
