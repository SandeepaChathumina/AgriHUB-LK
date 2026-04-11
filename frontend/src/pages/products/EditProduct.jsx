import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ProfileNav from "../../components/ProfileNav";

const EditProduct = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farmerLocation, setFarmerLocation] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    variety: "",
    quantity: "",
    unit: "kg",
    price: "",
    currency: "LKR",
    description: "",
    quality: "Standard",
    harvestDate: "",
    expiryDate: "",
    isAvailable: true,
    status: "Available",
    pickupLocation: {
      type: "Farmer Location",
      address: "",
      city: "",
      district: "",
      coordinates: { lat: "", lng: "" },
      instructions: "",
    },
  });

  const categories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Poultry",
    "Other",
  ];
  const units = ["kg", "g", "ton", "dozen", "pieces", "litre", "bundle"];
  const qualities = ["Premium", "Standard", "Economy"];

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProduct();
    fetchUserProfile();
  }, [token, id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      setFormData({
        productName: data.product.productName || "",
        category: data.product.category || "",
        variety: data.product.variety || "",
        quantity: data.product.quantity || "",
        unit: data.product.unit || "kg",
        price: data.product.price || "",
        currency: data.product.currency || "LKR",
        description: data.product.description || "",
        quality: data.product.quality || "Standard",
        harvestDate: data.product.harvestDate
          ? data.product.harvestDate.split("T")[0]
          : "",
        expiryDate: data.product.expiryDate
          ? data.product.expiryDate.split("T")[0]
          : "",
        isAvailable: data.product.isAvailable,
        status: data.product.status,
        pickupLocation: data.product.pickupLocation || {
          type: "Farmer Location",
          address: "",
          city: "",
          district: "",
          coordinates: { lat: "", lng: "" },
          instructions: "",
        },
      });
    } catch (error) {
      toast.error(error.message);
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.user && data.user.location) {
        setFarmerLocation(data.user.location);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        [field]: value,
      },
    }));
  };

  const handleCoordinatesChange = (coord, value) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        coordinates: {
          ...prev.pickupLocation.coordinates,
          [coord]: parseFloat(value) || "",
        },
      },
    }));
  };

  const useFarmerLocation = () => {
    if (farmerLocation) {
      setFormData((prev) => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          type: "Farmer Location",
          address: farmerLocation.address || "",
          city: farmerLocation.city || "",
          district: farmerLocation.district || "",
          coordinates: farmerLocation.coordinates || { lat: "", lng: "" },
        },
      }));
      toast.success("Farmer location loaded");
    }
  };

  const validateForm = () => {
    if (!formData.productName.trim()) return "Product name is required";
    if (!formData.quantity || formData.quantity <= 0)
      return "Quantity must be greater than zero";
    if (!formData.price || formData.price < 0)
      return "Price cannot be negative";
    if (!formData.pickupLocation.address.trim())
      return "Pickup address is required";
    if (
      !formData.pickupLocation.coordinates.lat ||
      !formData.pickupLocation.coordinates.lng
    ) {
      return "Pickup location coordinates are required";
    }
    const lat = parseFloat(formData.pickupLocation.coordinates.lat);
    const lng = parseFloat(formData.pickupLocation.coordinates.lng);
    if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
    if (lng < -180 || lng > 180)
      return "Longitude must be between -180 and 180";

    if (formData.harvestDate && formData.expiryDate) {
      if (
        new Date(formData.harvestDate).setHours(0, 0, 0, 0) >=
        new Date(formData.expiryDate).setHours(0, 0, 0, 0)
      ) {
        return "Harvest date must be before expiry date";
      }
    }
    if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      return "Price must be a valid number with up to 2 decimal places";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        harvestDate: formData.harvestDate || null,
        expiryDate: formData.expiryDate || null,
        pickupLocation: {
          ...formData.pickupLocation,
          coordinates: {
            lat: parseFloat(formData.pickupLocation.coordinates.lat),
            lng: parseFloat(formData.pickupLocation.coordinates.lng),
          },
        },
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      navigate("/products");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">Loading product...</div>
      </div>
    );
  }

  return (
    <>
      <ProfileNav
        active="products"
        links={[
          { key: "products", label: "My Products", to: "/products" },
          { key: "add-product", label: "Add Product", to: "/products/add" },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1
              className="text-4xl font-extrabold text-emerald-950 drop-shadow-sm mb-2"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Edit Product
            </h1>
            <p className="text-emerald-700/80 font-medium tracking-wide">
              Update your product information and listings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">
                Basic Information
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Variety
                  </label>
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleChange}
                    placeholder="e.g., Red Long, White Rose"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Quality
                  </label>
                  <select
                    name="quality"
                    value={formData.quality}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {qualities.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">
                Quantity & Pricing
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Price (LKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/70 font-bold">
                      LKR
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full rounded-2xl border-0 bg-slate-50/50 pl-14 pr-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-950">
                    Pickup Location
                  </h2>
                  <p className="text-emerald-700/70 font-medium">
                    Pinpoint exactly where your produce is stored
                  </p>
                </div>
                {farmerLocation && (
                  <button
                    type="button"
                    onClick={useFarmerLocation}
                    className="rounded-2xl bg-emerald-50/80 ring-1 ring-emerald-100 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition active:scale-95 shadow-sm"
                  >
                    Use Profile Location
                  </button>
                )}
              </div>
              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.pickupLocation.address}
                    onChange={(e) =>
                      handleLocationChange("address", e.target.value)
                    }
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    placeholder="Street address, landmark"
                    required
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.pickupLocation.city}
                      onChange={(e) =>
                        handleLocationChange("city", e.target.value)
                      }
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      value={formData.pickupLocation.district}
                      onChange={(e) =>
                        handleLocationChange("district", e.target.value)
                      }
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lat}
                      onChange={(e) =>
                        handleCoordinatesChange("lat", e.target.value)
                      }
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLocation.coordinates.lng}
                      onChange={(e) =>
                        handleCoordinatesChange("lng", e.target.value)
                      }
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Pickup Instructions
                  </label>
                  <textarea
                    value={formData.pickupLocation.instructions}
                    onChange={(e) =>
                      handleLocationChange("instructions", e.target.value)
                    }
                    rows="2"
                    placeholder="e.g., Call before arrival, Gate code, Landmarks, etc."
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">
                Additional Details
              </h2>
              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your product (quality, freshness, farming method, etc.)"
                    className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      max={formData.expiryDate || undefined}
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-600/80 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      min={
                        formData.harvestDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      className="w-full rounded-2xl border-0 bg-slate-50/50 px-4 py-4 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/30 text-emerald-950 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all">
              <h2 className="mb-6 text-2xl font-bold text-emerald-950">
                Product Status
              </h2>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="isAvailable"
                      value="true"
                      checked={formData.isAvailable === true}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isAvailable: true,
                          status: "Available",
                        }))
                      }
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all group-hover:border-emerald-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-950">
                    Available for Sale
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="isAvailable"
                      value="false"
                      checked={formData.isAvailable === false}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isAvailable: false,
                          status: "Sold Out",
                        }))
                      }
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all group-hover:border-orange-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-950">Sold Out</span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-[0.99] disabled:opacity-50 disabled:grayscale"
              >
                {saving ? "Updating Information..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="rounded-2xl border-2 border-slate-200 bg-white/80 px-8 py-4 text-lg font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProduct;
