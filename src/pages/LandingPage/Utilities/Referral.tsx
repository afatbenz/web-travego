import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Referral: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Sample referral code - in real app, this would come from user data
  const referralCode = "TraveGO2024";
  const referralLink = `https://TraveGO.com/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Link referral telah disalin!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Daftar TraveGO dengan kode referral saya',
        text: `Daftar di TraveGO dengan kode referral ${referralCode} dan dapatkan poin di setiap transaksi!`,
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Kode Referral
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bagikan kode referral Anda dan dapatkan poin
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Referral Code Section */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ini adalah kode referral kamu</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Referral Code Display */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
                <div className="text-4xl font-bold tracking-wider">
                  {referralCode}
                </div>
                <p className="text-blue-100 mt-2">Kode Referral Anda</p>
              </div>

              {/* Copy Button */}
              <Button
                onClick={handleCopyCode}
                className={`px-8 py-3 text-lg ${
                  copied 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Kode Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    Salin Kode
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Bagikan ke temanmu untuk register di TraveGO, dapatkan poin di setiap transaksi
              </p>
            </CardContent>
          </Card>

          {/* Referral Link Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Link Referral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                  {referralLink}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin Link
                </Button>
                
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Manfaat Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Untuk Anda
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Dapatkan 100 poin untuk setiap teman yang berhasil mendaftar
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Untuk Teman
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Dapatkan 50 poin bonus saat pertama kali mendaftar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
