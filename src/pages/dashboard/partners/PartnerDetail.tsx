import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PartnerNavState = {
  partner_id?: string;
  partner_name?: string;
  partner_phone?: string;
};

export const PartnerDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams<{ partner_id: string }>();
  const state = (location.state ?? {}) as PartnerNavState;

  const partnerId = decodeURIComponent(params.partner_id ?? state.partner_id ?? '');
  const partnerName = state.partner_name ?? '-';
  const partnerPhone = state.partner_phone ?? '-';

  return (
    <div className="bg-[#F5F7FB] min-h-screen">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Detail Partner</h1>
              <div className="mt-1 text-xs sm:text-sm text-gray-500">
                <span className="text-gray-500">Partner</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="font-medium text-gray-700">{partnerId || '-'}</span>
              </div>
            </div>
          </div>

          <Button variant="outline" className="bg-white border-gray-200/70 hover:bg-white" onClick={() => navigate(`${basePrefix}/fleet-units`)}>
            <Building2 className="mr-2 h-4 w-4" />
            Unit Armada
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Nama Partner</div>
                <div className="mt-1 text-base font-semibold text-gray-900 break-words">{partnerName}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Kontak Partner</div>
                <div className="mt-1 text-base font-semibold text-gray-900 break-words">{partnerPhone}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5">
            <div className="text-xs text-gray-500">Partner ID</div>
            <div className="mt-1 text-base font-semibold text-gray-900 break-words">{partnerId || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

