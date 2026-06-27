import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/useAuth";
import PrivateRoute from "./components/auth/PrivateRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Pages Routing
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";

import Home from "./pages/Dashboard/Home";
import UserDashBoard from "./pages/userPages/UserDashboard";

import NewsletterListing from "./components/tables/ListingComponents/NewsletterListing";
import ContactEnquiryListing from "./components/tables/ListingComponents/ContactEnquiryListing";
import PartnershipEnquiryListing from "./components/tables/ListingComponents/PartnershipEnquiryListing";
import OneCroreJourneyEnquiryListing from "./components/tables/ListingComponents/OneCroreJourneyEnquiryListing";
import WhoWeWorkWithEnquiryListing from "./components/tables/ListingComponents/WhoWeWorkWithEnquiryListing";
import FinancialWellnessEnquiryListing from "./components/tables/ListingComponents/FinancialWellnessEnquiryListing";
import CmsPageListing from "./components/tables/ListingComponents/CmsPageListing";
import TopicListing from "./components/tables/ListingComponents/TopicListing";

import ChangePasswordForm from "./components/header/ChangePasswordForm";


import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import AddCmsPage from "./components/AddCmsPage";
import AddSeo from "./components/AddSeo";
import ClusterListing from "./components/tables/ListingComponents/ClusterListing";
import AddCluster from "./components/AddCluster";
import AddTopic from "./components/AddTopic";
import ArticleListing from "./components/tables/ListingComponents/ArticleListing";
import AddArticle from "./components/AddArticle";
import ViewArticle from "./components/ViewArticle";
import ViewCMSPage from "./components/ViewCmsPage";
import SubscriptionListing from "./components/tables/ListingComponents/SubscriptionPlanListing";
import AddSubscriptionPlan from "./components/AddSubscriptionPlan";
import UserSubscriptionListing from "./components/tables/ListingComponents/UserSubscriptionListing";
import InvoicePage from "./components/InvoicePage";
import CustomerListing from "./components/tables/ListingComponents/CustomerListing";
import CustomerHistory from "./components/CustomerHistory";
import AddNewsletter from "./components/AddEditNewsletter";
import NewsletterPublishListing from "./components/tables/ListingComponents/NewsletterPublishListing";
import MFMainCategoryListing from "./components/tables/ListingComponents/MFMainCategoryListing";
import MFCategoryListing from "./components/tables/ListingComponents/MFCategoryListing";
import MFFundListing from "./components/tables/ListingComponents/MFFundListing";
import MFNfoListing from "./components/tables/ListingComponents/MFNfoListing";
import MFIndexSnapshotListing from "./components/tables/ListingComponents/MFIndexSnapshotListing";
import MFAmcListing from "./components/tables/ListingComponents/MFAmcListing";
import MFTopHoldingListing from "./components/tables/ListingComponents/MFTopHoldingListing";
import MFBenchmarkListing from "./components/tables/ListingComponents/MFBenchmarkListing";
import SeoListing from "./components/tables/ListingComponents/SeoListing";
import AddMFMainCategory from "./components/mf/AddMFMainCategory";
import AddMFCategory from "./components/mf/AddMFSubCategory";
import AddMFFund from "./components/mf/AddMFFund";
import AddMFNfo from "./components/mf/AddMFNfo";
import AddMFIndexSnapshot from "./components/mf/AddMFIndexSnapshot";
import AddMFAmc from "./components/mf/AddMFAmc";
import AddMFBenchmark from "./components/mf/AddMFBenchmark";
import MFBenchmarkReturnsManager from "./components/mf/MFBenchmarkReturnsManager";
import MFBenchmarkViewComparisonPage from "./components/mf/MFBenchmarkViewComparisonPage";
import AddMFTopHolding from "./components/mf/AddMFTopHolding";
import MFTopHoldingDetail from "./components/mf/MFTopHoldingDetail";
import MFTopHoldingHistoryPage from "./components/mf/MFTopHoldingHistoryPage";
import NavDashboardPage from "./modules/nav/pages/NavDashboardPage";
import NavHistoryPage from "./modules/nav/pages/NavHistoryPage";
import { renderMfApiRoutes } from "./modules/mf-api";
import FinancialWellnessEnquiryView from "./components/FinancialWellnessEnquiryView";
import TestimonialsPage from "./pages/Testimonials/TestimonialsPage";
import ErrorBoundary from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster
        position="top-right"
        containerStyle={{ top: 84 }}
        toastOptions={{
          style: {
            zIndex: 999999,
          },
        }}
      />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </Router>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-5 text-center">Loading...</p>;

  const role = user?.role?.toLowerCase();
  const isAdminOrEditor = role === "admin" || role === "editor";
  const isUserRole = role === "user";

  return (
    <Routes>
      {/* Default landing */}
      <Route
        path="/"
        element={
          user ? (
            isAdminOrEditor ? (
              <Navigate to={`/${role}/dashboard`} replace />
            ) : isUserRole ? (
              <Navigate to="/user/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      {/* Public Routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin & Editor Routes */}
      <Route
        element={
          <PrivateRoute roles={["admin", "editor"]}>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/:role/dashboard" element={<Home />} />

        <Route path="/:role/customers" element={<CustomerListing />} />

        <Route path="/:role/cluster" element={<ClusterListing />} />
        <Route path="/:role/cluster/create" element={<AddCluster />} />
        <Route path="/:role/cluster/edit/:id" element={<AddCluster />} />

        <Route path="/:role/topic" element={<TopicListing />} />
        <Route path="/:role/topic/create" element={<AddTopic />} />
        <Route path="/:role/topic/edit/:id" element={<AddTopic />} />

        <Route path="/:role/article" element={<ArticleListing />} />
        <Route path="/:role/article/create" element={<AddArticle />} />
        <Route path="/:role/article/edit/:id" element={<AddArticle />} />
        <Route path="/:role/article/view/:id" element={<ViewArticle />} />
        <Route path="/:role/cmspages/view/:id" element={<ViewCMSPage />} />

        {/* CMS Pages */}
        <Route path="/:role/cmspages" element={<CmsPageListing />} />
        <Route path="/:role/cmspages/create" element={<AddCmsPage />} />
        <Route path="/:role/cmspages/edit/:id" element={<AddCmsPage />} />
        <Route path="/:role/cmspages/view/:id" element={<ViewCMSPage />} />

        <Route path="/:role/seo" element={<SeoListing />} />
        <Route path="/:role/seo/create" element={<AddSeo />} />
        <Route path="/:role/seo/edit/:id" element={<AddSeo />} />

        <Route
          path="/:role/subscriptionplan"
          element={<SubscriptionListing />}
        />
        <Route
          path="/:role/subscriptionplan/create"
          element={<AddSubscriptionPlan />}
        />
        <Route
          path="/:role/subscriptionplan/edit/:id"
          element={<AddSubscriptionPlan />}
        />

        <Route
          path="/:role/user-subscription"
          element={<UserSubscriptionListing />}
        />

        <Route path="/:role/testimonials" element={<TestimonialsPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />

        <Route path="/user/invoice/:id" element={<InvoicePage />} />
        <Route path="/:role/profile" element={<UserProfiles />} />
        <Route path="/:role/change-password" element={<ChangePasswordForm />} />

        <Route
          path="/:role/user/customer-history/:id"
          element={<CustomerHistory />}
        />

        {/* get the added/edited newsletter from form data for subscribers */}
        <Route
          path="/:role/list-newsletter"
          element={<NewsletterPublishListing />}
        />
        <Route
          path="/:role/list-newsletter/create"
          element={<AddNewsletter />}
        />
        <Route
          path="/:role/list-newsletter/edit/:id"
          element={<AddNewsletter />}
        />
        <Route
          path="/:role/contact-enquiry"
          element={<ContactEnquiryListing />}
        />
        <Route
          path="/:role/partnership-enquiry"
          element={<PartnershipEnquiryListing />}
        />
        <Route
          path="/:role/one-crore-journey-enquiry"
          element={<OneCroreJourneyEnquiryListing />}
        />
        <Route
          path="/:role/who-we-work-with-enquiry"
          element={<WhoWeWorkWithEnquiryListing />}
        />
        <Route
          path="/:role/financial-wellness-enquiry"
          element={<FinancialWellnessEnquiryListing />}
        />
        <Route
          path="/:role/financial-wellness-enquiry/view/:id"
          element={<FinancialWellnessEnquiryView />}
        />

        {/* MF Admin Module */}
        <Route
          path="/:role/mf/main-categories"
          element={<MFMainCategoryListing />}
        />
        <Route
          path="/:role/mf/main-categories/create"
          element={<AddMFMainCategory />}
        />
        <Route
          path="/:role/mf/main-categories/edit/:id"
          element={<AddMFMainCategory />}
        />
        <Route path="/:role/mf/categories" element={<MFCategoryListing />} />
        <Route path="/:role/mf/categories/create" element={<AddMFCategory />} />
        <Route
          path="/:role/mf/categories/edit/:id"
          element={<AddMFCategory />}
        />
        <Route path="/:role/mf/funds" element={<MFFundListing />} />
        <Route path="/:role/mf/funds/create" element={<AddMFFund />} />
        <Route path="/:role/mf/funds/edit/:id" element={<AddMFFund />} />
        <Route path="/:role/mf/funds/view/:id" element={<AddMFFund />} />
        <Route path="/:role/nav/dashboard" element={<NavDashboardPage />} />
        <Route path="/:role/nav/history" element={<NavHistoryPage />} />
        <Route path="/:role/mf/nav-dashboard" element={<NavDashboardPage />} />
        <Route path="/:role/mf/nav-history" element={<NavHistoryPage />} />
        <Route path="/:role/mf/top-holdings" element={<MFTopHoldingListing />} />
        <Route path="/:role/mf/top-holdings/create" element={<AddMFTopHolding />} />
        <Route path="/:role/mf/top-holdings/edit/:id" element={<AddMFTopHolding />} />
        <Route path="/:role/mf/top-holdings/view/:id" element={<MFTopHoldingDetail />} />
        <Route path="/:role/mf/top-holdings/history/:schemeId" element={<MFTopHoldingHistoryPage />} />
        <Route path="/:role/mf/nfo" element={<MFNfoListing />} />
        <Route path="/:role/mf/nfo/create" element={<AddMFNfo />} />
        <Route path="/:role/mf/nfo/edit/:id" element={<AddMFNfo />} />
        <Route path="/:role/mf/amcs" element={<MFAmcListing />} />
        <Route path="/:role/mf/amcs/create" element={<AddMFAmc />} />
        <Route path="/:role/mf/amcs/edit/:id" element={<AddMFAmc />} />
        <Route path="/:role/benchmark/master" element={<MFBenchmarkListing />} />
        <Route path="/:role/benchmark/master/create" element={<AddMFBenchmark />} />
        <Route path="/:role/benchmark/master/edit/:id" element={<AddMFBenchmark />} />
        <Route path="/:role/benchmark/returns" element={<MFBenchmarkReturnsManager />} />
        <Route path="/:role/benchmark/view-comparison" element={<MFBenchmarkViewComparisonPage />} />
        <Route path="/:role/mf/benchmarks" element={<Navigate to={`/${role}/benchmark/master`} replace />} />
        <Route path="/:role/mf/benchmarks/create" element={<Navigate to={`/${role}/benchmark/master/create`} replace />} />
        <Route path="/:role/mf/benchmarks/edit/:id" element={<Navigate to={`/${role}/benchmark/master`} replace />} />
        <Route path="/:role/mf/benchmark-returns" element={<Navigate to={`/${role}/benchmark/returns`} replace />} />
        <Route
          path="/:role/mf/index-snapshots"
          element={<MFIndexSnapshotListing />}
        />
        <Route
          path="/:role/mf/index-snapshots/create"
          element={<AddMFIndexSnapshot />}
        />
        <Route
          path="/:role/mf/index-snapshots/edit/:id"
          element={<AddMFIndexSnapshot />}
        />
        {/* MF import route intentionally disabled */}

        {renderMfApiRoutes(role || "admin")}

        {/* Admin-only routes */}
        {role === "admin" && (
          <>
            {/* get the list for subscribers */}
            <Route path="/:role/newsletter" element={<NewsletterListing />} />
          </>
        )}
      </Route>

      {/* User Routes */}
      <Route
        element={
          <PrivateRoute roles={["user"]}>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/user/dashboard" element={<UserDashBoard />} />
        <Route path="/user/profile" element={<UserProfiles />} />
        <Route path="/user/change-password" element={<ChangePasswordForm />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}




