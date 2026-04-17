import React from 'react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Premium Landing Page Branding (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-center px-16 xl:px-24 relative overflow-hidden">
        {/* Abstract Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-transparent to-transparent"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center space-x-2 mb-10">
            {/* Simple CSS-based Logo */}
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg">
              R
            </div>
            <span className="text-2xl font-bold tracking-tight">RoomieMatch</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Find your ideal roommate, without the guesswork.
          </h1>
          <p className="text-xl text-brand-100 mb-10">
            Stop gambling on random internet listings. Our smart system matches you based on lifestyle compatibility, budgets, and strict dealbreakers.
          </p>
          
          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-800 rounded-xl shadow-inner text-xl">🎯</div>
              <div>
                <h3 className="font-bold text-lg">Smart Matching Algorithm</h3>
                <p className="text-brand-200 text-sm mt-1">We compare daily habits and non-negotiables to find your best fit.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-800 rounded-xl shadow-inner text-xl">📍</div>
              <div>
                <h3 className="font-bold text-lg">Precise Location Filtering</h3>
                <p className="text-brand-200 text-sm mt-1">Search within specific radiuses of your target ZIP code.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-800 rounded-xl shadow-inner text-xl">💬</div>
              <div>
                <h3 className="font-bold text-lg">Secure Connections</h3>
                <p className="text-brand-200 text-sm mt-1">Only chat when both parties accept a connection request.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: The Interactive Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50 lg:bg-white border-l border-gray-100">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              R
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">RoomieMatch</span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-gray-600 mb-8">{subtitle}</p>
          
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-gray-100 lg:border-none lg:shadow-none lg:p-0 lg:bg-transparent">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}