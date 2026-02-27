import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { AlertCenter } from '@/components/ui/alert-center';

// Layouts
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

// Scroll to top component
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// LandingPage Pages
import { Home } from '@/pages/LandingPage/Home';
import { Catalog } from '@/pages/LandingPage/Catalogue/Catalog';
import Armada from '@/pages/LandingPage/Armada/Armada';
import { Services } from '@/pages/LandingPage/Services';
import { Pricing } from '@/pages/LandingPage/Pricing';
import { Team } from '@/pages/LandingPage/Team';
import { Contact } from '@/pages/LandingPage/Contact';
import { CatalogDetail } from '@/pages/LandingPage/Catalogue/CatalogDetail';
import { ArmadaDetail } from '@/pages/LandingPage/Armada/ArmadaDetail';
import { CatalogCheckout } from '@/pages/LandingPage/Orders/CatalogCheckout';
import { ArmadaCheckout } from '@/pages/LandingPage/Orders/ArmadaCheckout';
import { Payment } from '@/pages/LandingPage/Orders/Payment';
import { MyProfile } from '@/pages/LandingPage/Profile/MyProfile';
import { Welcome } from '@/pages/LandingPage/Utilities/Welcome';
import { MyOrders } from '@/pages/LandingPage/Orders/MyOrders';
import { EditProfile } from '@/pages/LandingPage/Profile/EditProfile';
import { PromoDiscount } from '@/pages/LandingPage/Utilities/PromoDiscount';
import { Referral } from '@/pages/LandingPage/Utilities/Referral';
import { Reviews } from '@/pages/LandingPage/Utilities/Reviews';
import { CustomOrder } from '@/pages/LandingPage/Utilities/CustomOrder';

// Auth Pages
import { Login } from '@/pages/LandingPage/Auth/Login';
import { Register } from '@/pages/LandingPage/Auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Otp } from '@/pages/auth/Otp';
import { OrganizationRegister } from '@/pages/auth/OrganizationRegister';
import { OrganizationChoiceDashboard } from '@/pages/dashboard/organization/OrganizationChoice';
import { OrganizationRegisterDashboard } from '@/pages/dashboard/organization/OrganizationRegister';
import { OrganizationJoinDashboard } from '@/pages/dashboard/organization/OrganizationJoin';
import { OrganizationSettings } from '@/pages/dashboard/organization/OrganizationSettings';
import { OrganizationUsers } from '@/pages/dashboard/organization/OrganizationUsers';
import { OrganizationOpenApi } from '@/pages/dashboard/organization/OrganizationOpenApi';
import { OrganizationCompany } from '@/pages/dashboard/organization/OrganizationCompany';
import { OrganizationRoles } from '@/pages/dashboard/organization/OrganizationRoles';
import { OrganizationDivision } from '@/pages/dashboard/organization/OrganizationDivision';
import { PartnerProfile } from '@/pages/dashboard/partner/Profile';
import { PartnerProfileEdit } from '@/pages/dashboard/partner/ProfileEdit';
import PartnerContent from '@/pages/dashboard/partner/content/Content';
import ContentMenu from '@/pages/dashboard/partner/content/ContentMenu';
import { 
  GeneralContent, 
  ImageSliderContent, 
  CatalogueContent, 
  HotOffersContent, 
  ServicesContent, 
  TeamContent, 
  ContactContent,
  WhyChooseUsContent,
  SocialMediaContent,
  BankAccountContent
} from '@/pages/dashboard/partner/content/Pages';
import ImageLayout from '@/pages/dashboard/partner/content/ImageLayout';
import ContentEdit from '@/pages/dashboard/partner/content/ContentEdit';
import { OrganizationPending } from '@/pages/auth/OrganizationPending';
import { OrganizationJoin } from '@/pages/auth/OrganizationJoin';

// Dashboard Pages
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { OrdersTable } from '@/pages/dashboard/orders/OrdersTable';
import { OrderDetail } from '@/pages/dashboard/orders/OrderDetail';
import { ServicesPackages } from '@/pages/dashboard/ServicesPackages';
import { ServicesArmada } from '@/pages/dashboard/services/ServicesArmada';
import { PackageForm } from '@/pages/dashboard/services/PackageForm';
import { CreateArmada } from '@/pages/dashboard/services/CreateArmada';
import { EditArmada } from '@/pages/dashboard/services/EditArmada';
import { FleetDetail } from '@/pages/dashboard/services/FleetDetail';
import { TeamMember } from '@/pages/dashboard/team/TeamMember';
import { ScheduleArmada } from '@/pages/dashboard/team/ScheduleArmada';
import { AddSchedule } from '@/pages/dashboard/team/AddSchedule';

// New Customers Pages
import { AllCustomers } from '@/pages/dashboard/customers/AllCustomers';
import { RegisteredCustomers } from '@/pages/dashboard/customers/RegisteredCustomers';
import { CustomerRewards } from '@/pages/dashboard/customers/CustomerRewards';

// New Schedules Pages
import { FleetManagement } from '@/pages/dashboard/schedules/FleetManagement';
import { TeamSchedules } from '@/pages/dashboard/schedules/TeamSchedules';
import { LeaveManagement } from '@/pages/dashboard/schedules/LeaveManagement';

// Finance Pages
import { Revenue } from '@/pages/dashboard/finance/Revenue';
import { GeneralLedger } from '@/pages/dashboard/finance/GeneralLedger';
import { GeneralExpenses } from '@/pages/dashboard/finance/GeneralExpenses';
import { FleetExpenses } from '@/pages/dashboard/finance/FleetExpenses';
import { OperationalExpenses } from '@/pages/dashboard/finance/OperationalExpenses';

// New Coupons Pages
import { AllCoupons } from '@/pages/dashboard/coupons/AllCoupons';
import { AddCoupon } from '@/pages/dashboard/coupons/AddCoupon';

// Layout wrapper for public pages
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const PartnerNotFound: React.FC = () => {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-5xl font-bold text-gray-900 dark:text-white">404</p>
        <p className="text-gray-600 dark:text-gray-300">Halaman tidak ditemukan</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Area partner</p>
      </div>
    </div>
  );
};

const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar pelanggan organisasi</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-300">Belum ada data pelanggan.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          } />
          <Route path="/catalog" element={
            <PublicLayout>
              <Catalog />
            </PublicLayout>
          } />
          <Route path="/armada" element={
            <PublicLayout>
              <Armada />
            </PublicLayout>
          } />
          <Route path="/services" element={
            <PublicLayout>
              <Services />
            </PublicLayout>
          } />
          <Route path="/pricing" element={
            <PublicLayout>
              <Pricing />
            </PublicLayout>
          } />
          <Route path="/team" element={
            <PublicLayout>
              <Team />
            </PublicLayout>
          } />
          <Route path="/contact" element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          } />
          <Route path="/detail/catalog/:id" element={
            <PublicLayout>
              <CatalogDetail />
            </PublicLayout>
          } />
          <Route path="/detail/armada/:id" element={
            <PublicLayout>
              <ArmadaDetail />
            </PublicLayout>
          } />
          <Route path="/checkout/catalog/:id" element={
            <PublicLayout>
              <CatalogCheckout />
            </PublicLayout>
          } />
          <Route path="/checkout/armada/:id" element={
            <PublicLayout>
              <ArmadaCheckout />
            </PublicLayout>
          } />
          <Route path="/payment/:type/:id" element={
            <PublicLayout>
              <Payment />
            </PublicLayout>
          } />
          <Route path="/myprofile" element={
            <PublicLayout>
              <MyProfile />
            </PublicLayout>
          } />
          <Route path="/welcome" element={
            <PublicLayout>
              <Welcome />
            </PublicLayout>
          } />
          <Route path="/myorders" element={
            <PublicLayout>
              <MyOrders />
            </PublicLayout>
          } />
          <Route path="/edit-profile" element={
            <PublicLayout>
              <EditProfile />
            </PublicLayout>
          } />
          <Route path="/promo-discount" element={
            <PublicLayout>
              <PromoDiscount />
            </PublicLayout>
          } />
          <Route path="/referral" element={
            <PublicLayout>
              <Referral />
            </PublicLayout>
          } />
          <Route path="/reviews/:type/:id" element={
            <PublicLayout>
              <Reviews />
            </PublicLayout>
          } />
          <Route path="/custom-order/:type/:id" element={
            <PublicLayout>
              <CustomOrder />
            </PublicLayout>
          } />

          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/otp" element={<Otp />} />
          <Route path="/auth/organization/register" element={<OrganizationRegister />} />
          
          <Route path="/auth/organization/pending" element={<OrganizationPending />} />
          <Route path="/auth/organization/join" element={<OrganizationJoin />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard/partner" element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          } />
          <Route path="/dashboard" element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/choice" element={
            <DashboardLayout>
              <OrganizationChoiceDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/choice" element={
            <DashboardLayout>
              <OrganizationChoiceDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/register" element={
            <DashboardLayout>
              <OrganizationRegisterDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/register" element={
            <DashboardLayout>
              <OrganizationRegisterDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/join" element={
            <DashboardLayout>
              <OrganizationJoinDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/join" element={
            <DashboardLayout>
              <OrganizationJoinDashboard />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/settings" element={
            <DashboardLayout>
              <OrganizationSettings />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/settings" element={
            <DashboardLayout>
              <OrganizationSettings />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/users" element={
            <DashboardLayout>
              <OrganizationUsers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/users" element={
            <DashboardLayout>
              <OrganizationUsers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/open-api" element={
            <DashboardLayout>
              <OrganizationOpenApi />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/company" element={
            <DashboardLayout>
              <OrganizationCompany />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/company" element={
            <DashboardLayout>
              <OrganizationCompany />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/team-members" element={
            <DashboardLayout>
              <TeamMember />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/team-members" element={
            <DashboardLayout>
              <TeamMember />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/customers" element={
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/customers" element={
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/roles" element={
            <DashboardLayout>
              <OrganizationRoles />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/roles" element={
            <DashboardLayout>
              <OrganizationRoles />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/organization/division" element={
            <DashboardLayout>
              <OrganizationDivision />
            </DashboardLayout>
          } />
          <Route path="/dashboard/organization/division" element={
            <DashboardLayout>
              <OrganizationDivision />
            </DashboardLayout>
          } />

          {/* Customers Routes */}
          <Route path="/dashboard/partner/customers/all" element={
            <DashboardLayout>
              <AllCustomers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/customers/all" element={
            <DashboardLayout>
              <AllCustomers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/customers/registered" element={
            <DashboardLayout>
              <RegisteredCustomers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/customers/registered" element={
            <DashboardLayout>
              <RegisteredCustomers />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/customers/rewards" element={
            <DashboardLayout>
              <CustomerRewards />
            </DashboardLayout>
          } />
          <Route path="/dashboard/customers/rewards" element={
            <DashboardLayout>
              <CustomerRewards />
            </DashboardLayout>
          } />

          {/* Schedules Routes */}
          <Route path="/dashboard/partner/schedules/fleet-management" element={
            <DashboardLayout>
              <FleetManagement />
            </DashboardLayout>
          } />
          <Route path="/dashboard/schedules/fleet-management" element={
            <DashboardLayout>
              <FleetManagement />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/schedules/team-schedules" element={
            <DashboardLayout>
              <TeamSchedules />
            </DashboardLayout>
          } />
          <Route path="/dashboard/schedules/team-schedules" element={
            <DashboardLayout>
              <TeamSchedules />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/schedules/leave-management" element={
            <DashboardLayout>
              <LeaveManagement />
            </DashboardLayout>
          } />
          <Route path="/dashboard/schedules/leave-management" element={
            <DashboardLayout>
              <LeaveManagement />
            </DashboardLayout>
          } />

          {/* Finance Routes */}
          <Route path="/dashboard/partner/finance/revenue" element={
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          } />
          <Route path="/dashboard/finance/revenue" element={
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/finance/general-ledger" element={
            <DashboardLayout>
              <GeneralLedger />
            </DashboardLayout>
          } />
          <Route path="/dashboard/finance/general-ledger" element={
            <DashboardLayout>
              <GeneralLedger />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/finance/general-expenses" element={
            <DashboardLayout>
              <GeneralExpenses />
            </DashboardLayout>
          } />
          <Route path="/dashboard/finance/general-expenses" element={
            <DashboardLayout>
              <GeneralExpenses />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/finance/fleet-expenses" element={
            <DashboardLayout>
              <FleetExpenses />
            </DashboardLayout>
          } />
          <Route path="/dashboard/finance/fleet-expenses" element={
            <DashboardLayout>
              <FleetExpenses />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/finance/operational-expenses" element={
            <DashboardLayout>
              <OperationalExpenses />
            </DashboardLayout>
          } />
          <Route path="/dashboard/finance/operational-expenses" element={
            <DashboardLayout>
              <OperationalExpenses />
            </DashboardLayout>
          } />

          {/* Coupons Routes */}
          <Route path="/dashboard/partner/coupons/all" element={
            <DashboardLayout>
              <AllCoupons />
            </DashboardLayout>
          } />
          <Route path="/dashboard/coupons/all" element={
            <DashboardLayout>
              <AllCoupons />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/coupons/add" element={
            <DashboardLayout>
              <AddCoupon />
            </DashboardLayout>
          } />
          <Route path="/dashboard/coupons/add" element={
            <DashboardLayout>
              <AddCoupon />
            </DashboardLayout>
          } />

          <Route path="/dashboard/organization/open-api" element={
            <DashboardLayout>
              <OrganizationOpenApi />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/fleet" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                type="fleet"
                title="Fleet Orders" 
                description="Kelola pesanan armada" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/fleet" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                type="fleet"
                title="Fleet Orders" 
                description="Kelola pesanan armada" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/tour" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                type="tour"
                title="Tour Orders" 
                description="Kelola pesanan paket wisata" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/tour" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                type="tour"
                title="Tour Orders" 
                description="Kelola pesanan paket wisata" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/waiting-approval" element={
            <DashboardLayout>
              <OrdersTable 
                status="waiting-approval" 
                title="Waiting Approval" 
                description="Pesanan menunggu persetujuan" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/waiting-approval" element={
            <DashboardLayout>
              <OrdersTable 
                status="waiting-approval" 
                title="Waiting Approval" 
                description="Pesanan menunggu persetujuan" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/detail/:id" element={
            <DashboardLayout>
              <OrderDetail />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/detail/:id" element={
            <DashboardLayout>
              <OrderDetail />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/packages" element={
            <DashboardLayout>
              <ServicesPackages />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/packages" element={
            <DashboardLayout>
              <ServicesPackages />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/packages/create" element={
            <DashboardLayout>
              <PackageForm />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/packages/create" element={
            <DashboardLayout>
              <PackageForm />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/packages/edit/:id" element={
            <DashboardLayout>
              <PackageForm />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/packages/edit/:id" element={
            <DashboardLayout>
              <PackageForm />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/fleet" element={
            <DashboardLayout>
              <ServicesArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/fleet" element={
            <DashboardLayout>
              <ServicesArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/fleet/create" element={
            <DashboardLayout>
              <CreateArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/fleet/create" element={
            <DashboardLayout>
              <CreateArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/fleet/edit/:id" element={
            <DashboardLayout>
              <EditArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/fleet/edit/:id" element={
            <DashboardLayout>
              <EditArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/services/fleet/detail/:id" element={
            <DashboardLayout>
              <FleetDetail />
            </DashboardLayout>
          } />
          <Route path="/dashboard/services/fleet/detail/:id" element={
            <DashboardLayout>
              <FleetDetail />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/team/team-member" element={
            <DashboardLayout>
              <TeamMember />
            </DashboardLayout>
          } />
          <Route path="/dashboard/team/team-member" element={
            <DashboardLayout>
              <TeamMember />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/team/schedule-armada" element={
            <DashboardLayout>
              <ScheduleArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/team/schedule-armada" element={
            <DashboardLayout>
              <ScheduleArmada />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/team/schedule-armada/add" element={
            <DashboardLayout>
              <AddSchedule />
            </DashboardLayout>
          } />
          <Route path="/dashboard/team/schedule-armada/add" element={
            <DashboardLayout>
              <AddSchedule />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/profile" element={
            <DashboardLayout>
              <PartnerProfile />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/profile/edit" element={
            <DashboardLayout>
              <PartnerProfileEdit />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content" element={
            <DashboardLayout>
              <ContentMenu />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/general" element={
            <DashboardLayout>
              <GeneralContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/landing-page" element={
            <DashboardLayout>
              <PartnerContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/image-slider" element={
            <DashboardLayout>
              <ImageSliderContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/catalogue" element={
            <DashboardLayout>
              <CatalogueContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/catalogues" element={
            <DashboardLayout>
              <CatalogueContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/hot-offers" element={
            <DashboardLayout>
              <HotOffersContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/services" element={
            <DashboardLayout>
              <ServicesContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/team" element={
            <DashboardLayout>
              <TeamContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/contact" element={
            <DashboardLayout>
              <ContactContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/why-choose-us" element={
            <DashboardLayout>
              <WhyChooseUsContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/social-media" element={
            <DashboardLayout>
              <SocialMediaContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/bank-account" element={
            <DashboardLayout>
              <BankAccountContent />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/content/content/edit/:section_tag" element={
          <DashboardLayout>
            <ContentEdit />
          </DashboardLayout>
        } />
          <Route path="/dashboard/partner/content/image-layout" element={
            <DashboardLayout>
              <ImageLayout />
            </DashboardLayout>
          } />

          <Route path="/dashboard/partner/*" element={
            <DashboardLayout>
              <PartnerNotFound />
            </DashboardLayout>
          } />

          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
        <AlertCenter />
      </Router>
    </ThemeProvider>
  );
}

export default App;
