import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer
import CustomerDashboard from './pages/customer/Dashboard';
import Browse from './pages/customer/Browse';
import BookingForm from './pages/customer/BookingForm';
import MyBookings from './pages/customer/MyBookings';
import ReviewForm from './pages/customer/ReviewForm';
import CustomerSupport from './pages/customer/Support';

// Provider
import ProviderDashboard from './pages/provider/Dashboard';
import ManageSlots from './pages/provider/ManageSlots';
import ManageServices from './pages/provider/ManageServices';
import ManageAreas from './pages/provider/ManageAreas';
import JobComplete from './pages/provider/JobComplete';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import ErrorLogs from './pages/admin/ErrorLogs';
import AdminProviders from './pages/admin/Providers';
import AdminSupportTickets from './pages/admin/SupportTickets';
import AdminFeedback from './pages/admin/Feedback';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/customer" element={<Register type="CUSTOMER" />} />
        <Route path="/register/provider" element={<Register type="PROVIDER" />} />
        <Route path="/register" element={<Navigate to="/register/customer" replace />} />

        {/* Customer */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/browse"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/book/:providerId"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <BookingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/bookings"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/review/:bookingId"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <ReviewForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/support"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerSupport />
            </ProtectedRoute>
          }
        />

        {/* Provider */}
        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/slots"
          element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ManageSlots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/services"
          element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ManageServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/areas"
          element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <ManageAreas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/complete/:bookingId"
          element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <JobComplete />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/errors"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ErrorLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/providers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProviders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSupportTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminFeedback />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
