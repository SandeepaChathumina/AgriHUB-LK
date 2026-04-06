import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Homepage from './pages/homePage.jsx'
import AuthPage from './pages/Auth/AuthPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx' 
import Dashboard from './pages/Auth/Dashboard.jsx'
import AdminDashboard from './pages/Auth/AdminDashboard.jsx'
import AdminUsers from './pages/Auth/AdminUsers.jsx'
import AdminNotifications from './pages/Auth/AdminNotifications.jsx'
import UserNotifications from './pages/Auth/UserNotifications.jsx'
import VerifyEmail from './pages/Auth/VerifyEmail.jsx'
import ForgotPassword from './pages/Auth/ForgotPassword.jsx'
import ResetPassword from './pages/Auth/ResetPassword.jsx'
import ProfilePage from './pages/Auth/ProfilePage.jsx'
import OurMission from "./pages/OurMission";
import Contact from "./pages/Contact";
import FarmerRatings from './pages/reviews/FarmerRatings';
import TransporterRatings from './pages/reviews/TransporterRatings';

// NEW IMPORTS - Product Management
import ProductList from './pages/products/ProductList.jsx'
import AddProduct from './pages/products/AddProduct.jsx'
import EditProduct from './pages/products/EditProduct.jsx'
import MyProducts from './pages/products/MyProducts.jsx'  // Add this import

// NEW IMPORTS - Order Management
import CreateOrder from './pages/orders/CreateOrder.jsx'
import MyOrders from './pages/orders/MyOrders.jsx'
import AvailableVehicles from './pages/orders/AvailableVehicles.jsx';

// NEW IMPORTS - Messaging
import MessagesPage from './pages/messages/MessagesPage.jsx'

// NEW IMPORTS - Review Management
import ProductReviews from './pages/reviews/ProductReviews.jsx'
import PendingReviews from './pages/reviews/PendingReviews.jsx'

// it23831254 - Vehicle Management
import Vehicles from './pages/vehicles/Vehicles.jsx';
import AddVehicle from './pages/vehicles/AddVehicle.jsx';
import EditVehicle from './pages/vehicles/EditVehicle.jsx';
import VehicleDetails from './pages/vehicles/VehicleDetails.jsx';

// it23831254 - Trip Management
import MyTrips from './pages/trips/MyTrips.jsx';
import TripDetails from './pages/trips/TripDetails.jsx';
import AvailableOrders from './pages/trips/AvailableOrders.jsx';
import CreateTripPage from './pages/trips/CreateTripPage.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<OurMission />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/notifications" element={<UserNotifications />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          
          {/* Product Routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/my-products" element={<MyProducts />} />  {/* Add this route */}
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />

          {/* Order Routes */}
          <Route path="/order/:productId" element={<CreateOrder />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:orderId/request-transport" element={<AvailableVehicles />} />
          
          {/* Messaging Routes */}
          <Route path="/chat" element={<MessagesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          
          {/* Review Routes */}
          <Route path="/reviews/:targetType/:targetId" element={<ProductReviews />} />
          <Route path="/pending-reviews" element={<PendingReviews />} />

          {/* Vehicle Routes */}
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/add" element={<AddVehicle />} />
          <Route path="/vehicles/edit/:id" element={<EditVehicle />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />

          {/* Trip Routes */}
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trips/:id" element={<TripDetails />} />
          <Route path="/available-orders" element={<AvailableOrders />} />
          <Route path="/create-trip/:orderId" element={<CreateTripPage />} />

<Route path="/farmer-ratings" element={<FarmerRatings />} />
<Route path="/transporter-ratings" element={<TransporterRatings />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App