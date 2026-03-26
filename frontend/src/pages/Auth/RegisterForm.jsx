import React, { useState } from 'react';

const RegisterForm = () => {
  const [formValues, setFormValues] = useState({
    // Base User Fields
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'Farmer', // Match this with your Mongoose Discriminator Name
    address: '',
    city: '',
    district: '',
    
    // Farmer Specific
    farmSize: '',
    mainCrops: '', // Will split by comma on submit
    nicNumber: '',

    // Distributor Specific
    businessName: '',
    businessRegNumber: '',
    warehouseCapacity: '',

    // Transporter Specific
    companyName: '',
    fleetSize: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Transform the flat state into the nested structure your backend expects
    const payload = {
      fullName: formValues.fullName,
      email: formValues.email,
      password: formValues.password,
      phone: formValues.phone,
      role: formValues.role,
      location: {
        address: formValues.address,
        city: formValues.city,
        district: formValues.district,
      }
    };

    // Add role-specific data based on the selected role
    if (formValues.role === 'Farmer') {
      payload.farmSize = Number(formValues.farmSize);
      payload.nicNumber = formValues.nicNumber;
      // Convert comma separated string to array
      payload.mainCrops = formValues.mainCrops.split(',').map(crop => crop.trim()).filter(Boolean); 
    } 
    else if (formValues.role === 'Distributor') {
      payload.businessName = formValues.businessName;
      payload.businessRegNumber = formValues.businessRegNumber;
      payload.warehouseCapacity = Number(formValues.warehouseCapacity);
    } 
    else if (formValues.role === 'Transporter') {
      payload.companyName = formValues.companyName;
      payload.businessRegNumber = formValues.businessRegNumber;
      payload.fleetSize = Number(formValues.fleetSize);
    }

    console.log("Ready to send to backend:", payload);
    // TODO: wire up registration API call with the 'payload' object
  };

  return (
    <form className="flex flex-col gap-6 w-full max-w-md mx-auto" onSubmit={handleSubmit}>
      
      {/* --- 1. Basic Information --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 pb-2">Basic Info</h3>
        
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" type="text" value={formValues.fullName} onChange={handleChange} required
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="John Doe" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={formValues.email} onChange={handleChange} required
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="you@example.com" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={formValues.password} onChange={handleChange} required
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="••••••••" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="phone">Phone Number</label>
            <input id="phone" name="phone" type="tel" value={formValues.phone} onChange={handleChange} required
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="07X XXX XXXX" />
          </div>
        </div>
      </div>

      {/* --- 2. Location Details --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 pb-2">Location</h3>
        
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800" htmlFor="address">Address</label>
          <input id="address" name="address" type="text" value={formValues.address} onChange={handleChange}
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="123 Main Street" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="city">City</label>
            <input id="city" name="city" type="text" value={formValues.city} onChange={handleChange}
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Colombo" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="district">District</label>
            <input id="district" name="district" type="text" value={formValues.district} onChange={handleChange}
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Colombo" />
          </div>
        </div>
      </div>

      {/* --- 3. Role Selection & Specific Details --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 pb-2">Account Type</h3>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="role">I am a...</label>
          <div className="relative">
            <select id="role" name="role" value={formValues.role} onChange={handleChange}
              className="w-full appearance-none rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
              <option value="Farmer">Farmer</option>
              <option value="Distributor">Distributor</option>
              <option value="Transporter">Transporter</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
          </div>
        </div>

        {/* Dynamic Fields: Farmer */}
        {formValues.role === 'Farmer' && (
          <div className="grid grid-cols-1 gap-4 animate-fade-in-up">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="nicNumber">NIC Number</label>
              <input id="nicNumber" name="nicNumber" type="text" value={formValues.nicNumber} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 199012345678" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="farmSize">Farm Size (Acres)</label>
              <input id="farmSize" name="farmSize" type="number" value={formValues.farmSize} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 5" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="mainCrops">Main Crops</label>
              <input id="mainCrops" name="mainCrops" type="text" value={formValues.mainCrops} onChange={handleChange}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="Rice, Vegetables (comma separated)" />
            </div>
          </div>
        )}

        {/* Dynamic Fields: Distributor */}
        {formValues.role === 'Distributor' && (
          <div className="grid grid-cols-1 gap-4 animate-fade-in-up">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="businessName">Business Name</label>
              <input id="businessName" name="businessName" type="text" value={formValues.businessName} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. Fresh Foods Pvt Ltd" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="businessRegNumber">Business Reg Number</label>
              <input id="businessRegNumber" name="businessRegNumber" type="text" value={formValues.businessRegNumber} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. PV12345" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="warehouseCapacity">Warehouse Capacity (Sq Ft)</label>
              <input id="warehouseCapacity" name="warehouseCapacity" type="number" value={formValues.warehouseCapacity} onChange={handleChange}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 5000" />
            </div>
          </div>
        )}

        {/* Dynamic Fields: Transporter */}
        {formValues.role === 'Transporter' && (
          <div className="grid grid-cols-1 gap-4 animate-fade-in-up">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="companyName">Company Name</label>
              <input id="companyName" name="companyName" type="text" value={formValues.companyName} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. Speedy Logistics" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="businessRegNumber">Business Reg Number</label>
              <input id="businessRegNumber" name="businessRegNumber" type="text" value={formValues.businessRegNumber} onChange={handleChange} required
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. PV98765" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800" htmlFor="fleetSize">Fleet Size (Vehicles)</label>
              <input id="fleetSize" name="fleetSize" type="number" value={formValues.fleetSize} onChange={handleChange}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 10" />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full mt-4 rounded-xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95"
      >
        Create Account
      </button>
    </form>
  );
};

export default RegisterForm;