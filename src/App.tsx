/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Package, ShieldCheck, MapPin, Search, ArrowRight, Bell, User as UserIcon } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Badge } from './components/ui/Badge';
import { Alert } from './components/ui/Alert';

import { HomePage } from './pages/public/HomePage';
import { FindCenterPage } from './pages/public/FindCenterPage';
import { BecomeCenterPage } from './pages/public/BecomeCenterPage';
import { PricingPage } from './pages/public/PricingPage';
import { DeveloperPage } from './pages/public/DeveloperPage';
import { ContactPage } from './pages/public/ContactPage';
import { AboutPage } from './pages/public/AboutPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SafePayPage } from './pages/public/SafePayPage';
import { SafePayWorkspace } from './components/payment/SafePayWorkspace';
import { MerchantSolutionsPage } from './pages/public/MerchantSolutionsPage';
import { LogisticsPartnerPage } from './pages/public/LogisticsPartnerPage';
import { BecomeDispatchPartnerPage } from './pages/public/BecomeDispatchPartnerPage';
import { FAQPage } from './pages/public/FAQPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { AnnouncementBanner } from './components/marketing/AnnouncementBanner';
import { AdBanner } from './components/marketing/AdBanner';
import { BootstrapPage } from './pages/public/BootstrapPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { AccountRestrictedPage } from './pages/auth/AccountRestrictedPage';
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { ProfileCompletionPage } from './pages/auth/ProfileCompletionPage';
import { LegalConsentPage } from './pages/auth/LegalConsentPage';

import { Toaster } from 'sonner';
import { ProtectedRoute, RoleGuard } from './components/auth/RouteGuard';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useEffect } from 'react';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network.");
    } else {
      console.warn("Firebase connection test failed or skipped:", error);
    }
  }
}
testConnection().catch(err => {
  console.warn("Unhandled testConnection error:", err);
});

import { CustomerDashboard } from './pages/customer/Dashboard';
import { SendParcelPage } from './pages/customer/SendParcelPage';
import { ReceiveParcelPage } from './pages/customer/ReceiveParcelPage';
import { TrackParcelPage } from './pages/customer/TrackParcelPage';
import { FindHubPointPage } from './pages/customer/FindHubPointPage';
import { ShipmentHistoryPage } from './pages/customer/ShipmentHistoryPage';
import { NotificationsPage } from './pages/customer/NotificationsPage';
import { WalletPage } from './pages/customer/WalletPage';
import { SavedAddressesPage } from './pages/customer/SavedAddressesPage';
import { PaymentMethodsPage } from './pages/customer/PaymentMethodsPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { SupportPage } from './pages/customer/SupportPage';
import { SettingsPage } from './pages/customer/SettingsPage';
import { CustomerChatPage } from './pages/customer/ChatPage';
import { PaymentPage } from './pages/customer/PaymentPage';
import { ReturnRequestPage } from './pages/customer/ReturnRequestPage';

import { MerchantDashboard } from './pages/merchant/Dashboard';
import { CreateShipmentPage } from './pages/merchant/CreateShipmentPage';
import { BulkShipmentsPage } from './pages/merchant/BulkShipmentsPage';
import { OrdersPage } from './pages/merchant/OrdersPage';
import { TrackShipmentsPage } from './pages/merchant/TrackShipmentsPage';
import { ShipmentHistoryPage as MerchantHistoryPage } from './pages/merchant/ShipmentHistoryPage';
import { PaymentProtectionPage } from './pages/merchant/PaymentProtectionPage';
import { WalletPage as MerchantWalletPage } from './pages/merchant/WalletPage';
import { CustomersPage } from './pages/merchant/CustomersPage';
import { SavedHubsPage } from './pages/merchant/SavedHubsPage';
import { ReportsPage } from './pages/merchant/ReportsPage';
import { MerchantNotificationsPage } from './pages/merchant/NotificationsPage';
import { MerchantSupportPage } from './pages/merchant/SupportPage';
import { MerchantSettingsPage } from './pages/merchant/SettingsPage';
import { MerchantChatPage } from './pages/merchant/ChatPage';
import { ParcelFlyerPage } from './pages/merchant/ParcelFlyerPage';

import { PointOwnerDashboard } from './pages/point/OwnerDashboard';
import { PointStaffDashboard } from './pages/point/StaffDashboard';
import { ReceiveParcelPage as PointReceivePage } from './pages/point/ReceiveParcelPage';
import { ReleaseParcelPage as PointReleasePage } from './pages/point/ReleaseParcelPage';
import { BulkIntakePage } from './pages/point/BulkIntakePage';
import { InventoryPage as PointInventoryPage } from './pages/point/InventoryPage';
import { EmployeesPage as PointEmployeesPage } from './pages/point/EmployeesPage';
import { ShiftsPage as PointShiftsPage } from './pages/point/ShiftsPage';
import { EarningsPage as PointEarningsPage } from './pages/point/EarningsPage';
import { PayoutsPage as PointPayoutsPage } from './pages/point/PayoutsPage';
import { ReportsPage as PointReportsPage } from './pages/point/ReportsPage';
import { SupportPage as PointSupportPage } from './pages/point/SupportPage';
import { ProfilePage as PointProfilePage } from './pages/point/ProfilePage';
import { SettingsPage as PointSettingsPage } from './pages/point/SettingsPage';
import { SearchPage as PointSearchPage } from './pages/point/SearchPage';
import { HubCreateShipmentPage } from './pages/point/HubCreateShipmentPage';

import { OwnerDashboard as LogisticsOwnerDashboard } from './pages/logistics/OwnerDashboard';
import { StaffDashboard as LogisticsStaffDashboard } from './pages/logistics/StaffDashboard';
import { AssignedRoutesPage as LogisticsRoutesPage } from './pages/logistics/AssignedRoutesPage';
import { TransportJobsPage as LogisticsJobsPage } from './pages/logistics/TransportJobsPage';
import { FleetPage as LogisticsFleetPage } from './pages/logistics/FleetPage';
import { DriversPage as LogisticsDriversPage } from './pages/logistics/DriversPage';
import { ShipmentsPage as LogisticsShipmentsPage } from './pages/logistics/ShipmentsPage';
import { EarningsPage as LogisticsEarningsPage } from './pages/logistics/EarningsPage';
import { PayoutsPage as LogisticsPayoutsPage } from './pages/logistics/PayoutsPage';
import { ReportsPage as LogisticsReportsPage } from './pages/logistics/ReportsPage';
import { NotificationsPage as LogisticsNotificationsPage } from './pages/logistics/NotificationsPage';
import { SupportPage as LogisticsSupportPage } from './pages/logistics/SupportPage';
import { ProfilePage as LogisticsProfilePage } from './pages/logistics/ProfilePage';
import { SettingsPage as LogisticsSettingsPage } from './pages/logistics/SettingsPage';
import { ScanWorkspacePage as LogisticsScanPage } from './pages/logistics/ScanWorkspacePage';
import { ExceptionReportingPage as LogisticsExceptionPage } from './pages/logistics/ExceptionReportingPage';

import { AdminContentCMSPage } from './pages/admin/AdminContentCMSPage';
import { TrainingAcademyPage } from './pages/admin/TrainingAcademyPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HelpCenterConfigPage } from './pages/admin/HelpCenterConfigPage';
import { BrandAssetsPage } from './pages/admin/BrandAssetsPage';
import { MarketingCenterPage } from './pages/admin/MarketingCenterPage';
import { AdminDisputesPage } from './pages/admin/DisputesPage';
import { UsersPage as AdminUsersPage } from './pages/admin/UsersPage';
import { HubApprovalsPage } from './pages/admin/HubApprovalsPage';
import { VerificationPage as AdminVerificationPage } from './pages/admin/VerificationPage';
import { CountriesPage as AdminCountriesPage } from './pages/admin/CountriesPage';

import { PricingRulesPage } from './pages/admin/PricingRulesPage';
import { TrustRankingPage } from './pages/admin/TrustRankingPage';
import { PointsRatingPage } from './pages/admin/PointsRatingPage';
import { CommissionPayoutPage } from './pages/admin/CommissionPayoutPage';
import { OperationsRulesPage } from './pages/admin/OperationsRulesPage';
import { GlobalConfigPage } from './pages/admin/GlobalConfigPage';
import { PaymentProtectionRulesPage } from './pages/admin/PaymentProtectionRulesPage';
import { PromotionsTaxesPage } from './pages/admin/PromotionsTaxesPage';
import { SecurityDashboardPage } from './pages/admin/SecurityDashboardPage';
import { OperationalCctvPage } from './pages/admin/OperationalCctvPage';
import { GlobalSettingsPage } from './pages/admin/GlobalSettingsPage';
import { InfrastructureCertificationPage } from './pages/admin/InfrastructureCertificationPage';
import { CommissionManagementPage } from './pages/admin/CommissionManagementPage';
import { RevenueReportsPage } from './pages/admin/RevenueReportsPage';
import { ComplaintCentrePage as AdminComplaintCentrePage } from './pages/admin/ComplaintCentrePage';
import { HelpCenterWidget } from './components/support/HelpCenterWidget';

import { OverviewPage } from './pages/admin/OverviewPage';
import { PlatformOperationsPage as AdminPlatformOpsPage } from './pages/admin/PlatformOperationsPage';
import { AdminIntegrationsPage } from './pages/admin/AdminIntegrationsPage';
import { ReportsPage as AdminReportsPage } from './pages/admin/ReportsPage';
import { NotificationsConfigPage } from './pages/admin/NotificationsConfigPage';
import { TestModePage } from './pages/admin/TestModePage';
import { SearchResultsPage as AdminSearchResultsPage } from './pages/admin/SearchResultsPage';

import { DeveloperDashboard } from './pages/developer/Dashboard';
import { ApiKeysPage as DeveloperKeysPage } from './pages/developer/ApiKeysPage';
import { WebhooksPage as DeveloperWebhooksPage } from './pages/developer/WebhooksPage';
import { DispatchDashboard } from './pages/dispatch/Dashboard';
import { VerifyRiderPage } from './pages/public/VerifyRiderPage';
import { VerifyReceiptPage } from './pages/public/VerifyReceiptPage';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 overflow-y-auto overflow-x-hidden scroll-smooth">
          <Toaster position="top-right" richColors />
          <AnnouncementBanner />
          <main className="flex-1 flex flex-col min-h-0">
            <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/safepay" element={<SafePayPage />} />
          <Route path="/safepay/workspace" element={<ProtectedRoute><SafePayWorkspace /></ProtectedRoute>} />
          <Route path="/safepay/workspace/:id" element={<ProtectedRoute><SafePayWorkspace /></ProtectedRoute>} />
          <Route path="/find-center" element={<FindCenterPage />} />
          <Route path="/merchants" element={<MerchantSolutionsPage />} />
          <Route path="/centers" element={<BecomeCenterPage />} />
          <Route path="/partners" element={<LogisticsPartnerPage />} />
          <Route path="/become-dispatch-partner" element={<BecomeDispatchPartnerPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/api" element={<DeveloperPage />} />
          <Route path="/verify-receipt" element={<VerifyReceiptPage />} />
          <Route path="/developer" element={<ProtectedRoute><RoleGuard allowedRoles={['DEVELOPER', 'SUPER_ADMIN']}><DeveloperDashboard /></RoleGuard></ProtectedRoute>} />
          <Route path="/developer/keys" element={<ProtectedRoute><RoleGuard allowedRoles={['DEVELOPER', 'SUPER_ADMIN']}><DeveloperKeysPage /></RoleGuard></ProtectedRoute>} />
          <Route path="/developer/webhooks" element={<ProtectedRoute><RoleGuard allowedRoles={['DEVELOPER', 'SUPER_ADMIN']}><DeveloperWebhooksPage /></RoleGuard></ProtectedRoute>} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/bootstrap" element={<BootstrapPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/account-restricted" element={<AccountRestrictedPage />} />
          <Route path="/legal-consent" element={<ProtectedRoute><LegalConsentPage /></ProtectedRoute>} />
          <Route path="/role-selection" element={<ProtectedRoute><RoleSelectionPage /></ProtectedRoute>} />
          <Route path="/profile-completion" element={<ProtectedRoute><ProfileCompletionPage /></ProtectedRoute>} />

        {/* Customer Module Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><CustomerDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/send" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']} requiredPermission="SEND_PARCEL"><SendParcelPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/receive" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><ReceiveParcelPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/track" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><TrackParcelPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/hubs" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><FindHubPointPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/history" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><ShipmentHistoryPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/notifications" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><NotificationsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/wallet" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><WalletPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/addresses" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><SavedAddressesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/payments" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><PaymentMethodsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><ProfilePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/support" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><SupportPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/chat" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><CustomerChatPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/settings" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><SettingsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/payment/:parcelId" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'MERCHANT', 'SUPER_ADMIN']}><PaymentPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/customer/returns/:parcelId" element={<ProtectedRoute><RoleGuard allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ReturnRequestPage /></RoleGuard></ProtectedRoute>} />

        {/* Merchant Module Routes */}
        <Route path="/merchant/dashboard" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/shipments/create" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><CreateShipmentPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/shipments/bulk" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><BulkShipmentsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/orders" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><OrdersPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/shipments/track" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><TrackShipmentsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/shipments/history" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantHistoryPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/payment-protection" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><PaymentProtectionPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/wallet" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantWalletPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/customers" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><CustomersPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/hubs/saved" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><SavedHubsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/reports" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><ReportsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/notifications" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantNotificationsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/support" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantSupportPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/chat" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantChatPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/settings" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><MerchantSettingsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/merchant/flyer" element={<ProtectedRoute><RoleGuard allowedRoles={['MERCHANT', 'SUPER_ADMIN']}><ParcelFlyerPage /></RoleGuard></ProtectedRoute>} />

        {/* Point Module Routes */}
        <Route path="/point/dashboard/owner" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_OWNER', 'SUPER_ADMIN']}><PointOwnerDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/dashboard/staff" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointStaffDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/shipments/book" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><HubCreateShipmentPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/parcels/receive" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointReceivePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/parcels/release" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointReleasePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/parcels/bulk-intake" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><BulkIntakePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/bulk-intake" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><BulkIntakePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/inventory" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointInventoryPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/employees" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_OWNER', 'SUPER_ADMIN']}><PointEmployeesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/shifts" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointShiftsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/earnings" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_OWNER', 'SUPER_ADMIN']}><PointEarningsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/payouts" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_OWNER', 'SUPER_ADMIN']}><PointPayoutsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/reports" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_OWNER', 'SUPER_ADMIN']}><PointReportsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/support" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointSupportPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/profile" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointProfilePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/settings" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointSettingsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/point/search" element={<ProtectedRoute><RoleGuard allowedRoles={['CENTER_STAFF', 'CENTER_OWNER', 'SUPER_ADMIN']}><PointSearchPage /></RoleGuard></ProtectedRoute>} />

        {/* Logistics Module Routes */}
        <Route path="/logistics/dashboard/owner" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsOwnerDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/dashboard/staff" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsStaffDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/routes" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsRoutesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/jobs" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsJobsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/fleet" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsFleetPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/drivers" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsDriversPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/shipments" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsShipmentsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/earnings" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsEarningsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/payouts" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsPayoutsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/reports" element={<ProtectedRoute><RoleGuard allowedRoles={['LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsReportsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/notifications" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsNotificationsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/support" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsSupportPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/profile" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsProfilePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/settings" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsSettingsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/scan" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsScanPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/logistics/exception" element={<ProtectedRoute><RoleGuard allowedRoles={['DRIVER', 'LOGISTICS_OWNER', 'LOGISTICS_COMPANY', 'SUPER_ADMIN']}><LogisticsExceptionPage /></RoleGuard></ProtectedRoute>} />

        {/* Driver/Staff specific routes mapping to same components but accessible via staff sidebar */}
        <Route path="/logistics/staff/jobs" element={<LogisticsJobsPage />} />
        <Route path="/logistics/staff/routes" element={<LogisticsRoutesPage />} />
        <Route path="/logistics/staff/completed" element={<LogisticsShipmentsPage />} />

        {/* Dispatch Rider Module Routes */}
        <Route path="/dispatch/dashboard" element={<ProtectedRoute><RoleGuard allowedRoles={['DISPATCH_RIDER', 'SUPER_ADMIN']}><DispatchDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/public/verify-rider/:riderId" element={<VerifyRiderPage />} />

        {/* Platform Admin Module Routes */}
        <Route path="/admin" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER']}><AdminDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminContentCMSPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/training" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><TrainingAcademyPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminDashboard /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/branding" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><BrandAssetsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/marketing" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><MarketingCenterPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminUsersPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/hub-approvals" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><HubApprovalsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/verification" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'VERIFICATION_OFFICER']}><AdminVerificationPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER']}><AdminDisputesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER']}><AdminComplaintCentrePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER']}><AdminComplaintCentrePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/countries" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminCountriesPage /></RoleGuard></ProtectedRoute>} />

        {/* Business Rules Engine Routes */}
        <Route path="/admin/business-rules" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_OFFICER']}><PricingRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/pricing" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_OFFICER']}><PricingRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/trust-score" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><TrustRankingPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/ranking" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><TrustRankingPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/points" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><PointsRatingPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/payouts" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><CommissionPayoutPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/commissions" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><CommissionPayoutPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/parcels" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><OperationsRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/zones" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><OperationsRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/services" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><OperationsRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/global" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><GlobalConfigPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/payment-protection" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><PaymentProtectionRulesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/promotions" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_OFFICER']}><PromotionsTaxesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/taxes" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><PromotionsTaxesPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/business-rules/integrations" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminIntegrationsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/integrations" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><AdminIntegrationsPage /></RoleGuard></ProtectedRoute>} />

        <Route path="/admin/audit" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><SecurityDashboardPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/cctv-monitoring" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><OperationalCctvPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/commissions" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><CommissionManagementPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/revenue" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_OFFICER']}><RevenueReportsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><GlobalSettingsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/infrastructure" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN']}><InfrastructureCertificationPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/help-center" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN']}><HelpCenterConfigPage /></RoleGuard></ProtectedRoute>} />

        <Route path="/admin/overview" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER']}><OverviewPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER']}><AdminReportsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/platform-ops" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminPlatformOpsPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><NotificationsConfigPage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/test-mode" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER']}><TestModePage /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/search" element={<ProtectedRoute><RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER']}><AdminSearchResultsPage /></RoleGuard></ProtectedRoute>} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <AdBanner />
          <HelpCenterWidget />
        </div>
      </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
