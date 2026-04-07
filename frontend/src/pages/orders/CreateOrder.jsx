import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../api/orders';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const DEFAULT_CENTER = [7.8731, 80.7718];

const DestinationPicker = ({ onPick }) => {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng);
    },
  });

  return null;
};

const CreateOrder = () => {
  const { token, user } = useAuth();
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(location.state?.product || null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState({
    addressLine: '',
    city: '',
    coordinates: {
      lat: '',
      lng: '',
    },
  });

  const selectedPosition = useMemo(() => {
    const lat = Number(deliveryAddress.coordinates.lat);
    const lng = Number(deliveryAddress.coordinates.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }

    return null;
  }, [deliveryAddress.coordinates.lat, deliveryAddress.coordinates.lng]);

  const mapCenter = selectedPosition || DEFAULT_CENTER;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'Distributor') {
      toast.error('Only distributors can place orders');
      navigate('/products');
      return;
    }

    if (!product?._id) {
      void loadProduct();
    }
  }, [token, user?.role, product?._id, productId]);

  const loadProduct = async () => {
    setLoadingProduct(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Unable to load product details');
      const data = await res.json();
      setProduct(data?.product || null);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch product');
    } finally {
      setLoadingProduct(false);
    }
  };

  const maxQuantity = useMemo(() => {
    const val = Number(product?.quantity || 0);
    return Number.isFinite(val) && val > 0 ? val : 1;
  }, [product?.quantity]);

  const totalPrice = useMemo(() => {
    const price = Number(product?.price || 0);
    return price * Number(quantity || 0);
  }, [product?.price, quantity]);

  const updateAddressField = (key, value) => {
    setDeliveryAddress((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateCoordinate = (key, value) => {
    setDeliveryAddress((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [key]: value,
      },
    }));
  };

  const setCoordinates = (lat, lng) => {
    setDeliveryAddress((prev) => ({
      ...prev,
      coordinates: {
        lat: Number(lat).toFixed(6),
        lng: Number(lng).toFixed(6),
      },
    }));
  };

  const handleMapPick = (latlng) => {
    setCoordinates(latlng.lat, latlng.lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates(position.coords.latitude, position.coords.longitude);
        toast.success('Current location selected');
        setLocating(false);
      },
      () => {
        toast.error('Unable to get your current location');
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const validateForm = () => {
    if (!product?._id) return 'Product data is missing';
    if (!quantity || Number(quantity) < 1) return 'Quantity must be at least 1';
    if (Number(quantity) > Number(product.quantity)) return 'Quantity exceeds available stock';
    if (!deliveryAddress.addressLine.trim()) return 'Delivery address is required';
    if (!deliveryAddress.city.trim()) return 'City is required';

    const lat = Number(deliveryAddress.coordinates.lat);
    const lng = Number(deliveryAddress.coordinates.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return 'Latitude and longitude are required';
    }

    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
    if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: product._id,
        quantity: Number(quantity),
        deliveryAddress: {
          addressLine: deliveryAddress.addressLine.trim(),
          city: deliveryAddress.city.trim(),
          coordinates: {
            lat: Number(deliveryAddress.coordinates.lat),
            lng: Number(deliveryAddress.coordinates.lng),
          },
        },
      };

      const data = await createOrder(token, payload);
      toast.success(data?.message || 'Order created');

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      navigate('/orders');
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ProfileNav
        active="create-order"
        links={[
          { key: 'products', label: 'All Products', to: '/products' },
          { key: 'orders', label: 'My Orders', to: '/orders' },
        ]}
      />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Place Order</h1>
              <p className="text-slate-600">Confirm quantity and delivery location before checkout</p>
            </div>
            <Link
              to="/products"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Back to Products
            </Link>
          </div>

          {loadingProduct ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">Loading product...</p>
            </div>
          ) : !product ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">Product not found.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Product Summary</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p><span className="font-semibold">Product:</span> {product.productName}</p>
                  <p><span className="font-semibold">Farmer:</span> {product.farmer?.fullName || 'N/A'}</p>
                  <p><span className="font-semibold">Price:</span> LKR {Number(product.price || 0).toLocaleString()}</p>
                  <p><span className="font-semibold">Available:</span> {product.quantity} {product.unit || 'kg'}</p>
                  <p><span className="font-semibold">Pickup District:</span> {product.pickupLocation?.district || 'N/A'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Quantity ({product.unit || 'kg'})</label>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Address Line</label>
                    <input
                      type="text"
                      value={deliveryAddress.addressLine}
                      onChange={(e) => updateAddressField('addressLine', e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="House no, street, area"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => updateAddressField('city', e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="City"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={deliveryAddress.coordinates.lat}
                        onChange={(e) => updateCoordinate('lat', e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                        placeholder="6.9271"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={deliveryAddress.coordinates.lng}
                        onChange={(e) => updateCoordinate('lng', e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                        placeholder="79.8612"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">Pick destination on map</p>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                        className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {locating ? 'Locating...' : 'Use My Current Location'}
                      </button>
                    </div>

                    <p className="mb-2 text-xs text-slate-500">Click anywhere on the map to auto-fill latitude and longitude.</p>

                    <div className="h-64 overflow-hidden rounded-xl border border-emerald-200">
                      <MapContainer center={mapCenter} zoom={selectedPosition ? 13 : 8} scrollWheelZoom className="h-full w-full">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DestinationPicker onPick={handleMapPick} />
                        {selectedPosition ? <Marker position={selectedPosition} /> : null}
                      </MapContainer>
                    </div>

                    {selectedPosition ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Selected coordinates: {Number(deliveryAddress.coordinates.lat).toFixed(6)}, {Number(deliveryAddress.coordinates.lng).toFixed(6)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No location selected yet.</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Estimated total: LKR {totalPrice.toLocaleString()}</p>
                    <p className="mt-1 text-xs">You will be redirected to Stripe checkout after confirming.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order & Continue to Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateOrder;
