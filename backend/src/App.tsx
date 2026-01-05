// import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
// import BlogList from "./pages/Blogs/BlogList";


import NewsletterLisging from "./components/tables/ListingComponents/NewsletterLisging";
import ContactEnquiryListing from "./components/tables/ListingComponents/ContactEnquiryListing";
import CmsPageListing from "./components/tables/ListingComponents/CmsPageListing";
import TopicListing from "./components/tables/ListingComponents/TopicListing";

import ChangePasswordForm from "./components/header/ChangePasswordForm";

import Calendar from "./pages/Calendar";
import FormElements from "./pages/Forms/FormElements";
import BasicTables from "./pages/Tables/BasicTables";
import Blank from "./pages/Blank";

import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";

import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import AddCmsPage from "./components/AddCmsPage";
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-5 text-center">Loading...</p>;

  const role = user?.role;

  return (
    <Routes>
  {/* Default landing */}
  <Route
    path="/"
    element={
      user ? (
        role === "admin" || role === "editor" ? (
          <Navigate to={`/${role}/dashboard`} replace />
        ) : (
          <Navigate to="/user/dashboard" replace />
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
  <Route element={<PrivateRoute roles={["admin", "editor"]}><AppLayout /></PrivateRoute>}>
    <Route path="/:role/dashboard" element={<Home />} />

    <Route path="/customers" element={<CustomerListing/>} />

    <Route path="/:role/cluster" element={<ClusterListing/>} />
    <Route path="/:role/cluster/create" element={<AddCluster/>} />
    <Route path="/:role/cluster/edit/:id" element={<AddCluster/>} />

    
     <Route path="/:role/topic" element={<TopicListing/>} />
      <Route path="/:role/topic/create" element={<AddTopic/>} />
      <Route path="/:role/topic/edit/:id" element={<AddTopic />} />

      <Route path="/:role/article" element={<ArticleListing/>} />
      <Route path="/:role/article/create" element={<AddArticle />} />
      <Route path="/:role/article/edit/:id" element={<AddArticle/>} />
     <Route path="/:role/article/view/:id" element={<ViewArticle />} />
      <Route path="/:role/cmspages/view/:id" element={<ViewCMSPage />} />

      {/* CMS Pages */}
  <Route path="/:role/cmspages" element={<CmsPageListing />} />
  <Route path="/:role/cmspages/create" element={<AddCmsPage />} />
  <Route path="/:role/cmspages/edit/:id" element={<AddCmsPage/>} />
  <Route path="/:role/cmspages/view/:id" element={<ViewCMSPage />} />

  <Route path="/:role/subscriptionplan" element={<SubscriptionListing />} />
  <Route path="/:role/subscriptionplan/create" element={<AddSubscriptionPlan />} />
  <Route path="/:role/subscriptionplan/edit/:id" element={<AddSubscriptionPlan/>} />

  <Route path="/:role/user-subscription" element={<UserSubscriptionListing />} />

   <Route path="/user/invoice/:id" element={<InvoicePage />} />
    <Route path="/:role/profile" element={<UserProfiles />} />  
    <Route path="/:role/change-password" element={<ChangePasswordForm />} />

  <Route path="/:role/user/customer-history/:id" element={<CustomerHistory />} />

    

    {/* Admin-only routes */}
    {role === "admin" && (
      <>
        <Route path="/:role/newsletter" element={<NewsletterLisging />} />
        <Route path="/:role/contactenquiry" element={<ContactEnquiryListing />} />

        <Route path="/form-elements" element={<FormElements />} />
        <Route path="/basic-tables" element={<BasicTables />} />
        <Route path="/blank" element={<Blank />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/images" element={<Images />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/bar-chart" element={<BarChart />} />
        <Route path="/calendar" element={<Calendar />} />
      </>
    )}
  </Route>

  {/* User Routes */}
  <Route element={<PrivateRoute roles={["user"]}><AppLayout /></PrivateRoute>}>
    <Route path="/user/dashboard" element={<UserDashBoard />} />
    <Route path="/user/profile" element={<UserProfiles />} />          
    <Route path="/user/change-password" element={<ChangePasswordForm />} /> 
  </Route>

  {/* Fallback */}
  <Route path="*" element={<NotFound />} />
</Routes>

  );
}
