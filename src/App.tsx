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
import { PartnerProfile } from '@/pages/dashboard/partner/Profile';
import { PartnerProfileEdit } from '@/pages/dashboard/partner/ProfileEdit';
import PartnerContent from '@/pages/dashboard/partner/content/Content';
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
          <Route path="/dashboard/organization/open-api" element={
            <DashboardLayout>
              <OrganizationOpenApi />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/all-table" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                title="Semua Order" 
                description="Kelola semua pesanan pelanggan" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/all-table" element={
            <DashboardLayout>
              <OrdersTable 
                status="all" 
                title="Semua Order" 
                description="Kelola semua pesanan pelanggan" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/ongoing-table" element={
            <DashboardLayout>
              <OrdersTable 
                status="ongoing" 
                title="Order Berlangsung" 
                description="Monitor pesanan yang sedang berlangsung" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/ongoing-table" element={
            <DashboardLayout>
              <OrdersTable 
                status="ongoing" 
                title="Order Berlangsung" 
                description="Monitor pesanan yang sedang berlangsung" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/partner/orders/success" element={
            <DashboardLayout>
              <OrdersTable 
                status="success" 
                title="Order Sukses" 
                description="Pesanan yang telah selesai dengan sukses" 
              />
            </DashboardLayout>
          } />
          <Route path="/dashboard/orders/success" element={
            <DashboardLayout>
              <OrdersTable 
                status="success" 
                title="Order Sukses" 
                description="Pesanan yang telah selesai dengan sukses" 
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
          <Route path="/dashboard/partner/content/content" element={
            <DashboardLayout>
              <PartnerContent />
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
