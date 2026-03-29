import React, { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { User, Download, LayoutTemplate, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 500);
  };

  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* HEADER */}
        <div className="pb-5 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Global Configuration
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Settings
          </h1>
        </div>

        <div className="space-y-6 sm:space-y-8 mt-6">
          
          {/* PROFILE SECTION */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <User size={18} className="text-gray-400" />
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Profile Information</h3>
                <p className="text-[13px] text-gray-500">Manage your personal account details</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Full Name</label>
                  <input type="text" defaultValue={user?.username || 'Admin'} className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Email Address</label>
                  <input type="email" defaultValue={`${user?.username?.toLowerCase() || 'admin'}@surveylabs.co`} disabled className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-[14px] text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          </section>

          {/* SURVEY DEFAULTS */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <LayoutTemplate size={18} className="text-gray-400" />
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Survey Defaults</h3>
                <p className="text-[13px] text-gray-500">Configure factory settings for new surveys</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Default Question Type</label>
                  <select className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                    <option value="mcq">Multiple Choice</option>
                    <option value="rating">Rating Scale</option>
                    <option value="text">Short Text</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Response Limits</label>
                  <select className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                    <option value="unlimited">Unlimited Responses</option>
                    <option value="one">One per device</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 shadow-sm cursor-pointer" />
                  <span className="text-[14px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Enable AI Quality Filtering globally</span>
                </label>
              </div>
            </div>
          </section>

          {/* EXPORT SETTINGS */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Download size={18} className="text-gray-400" />
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Export & Integrations</h3>
                <p className="text-[13px] text-gray-500">Control how data leaves your workspace</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5 max-w-sm">
                <label className="text-[13px] font-semibold text-gray-700">CSV Date Format</label>
                <select className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="iso">ISO 8601 (YYYY-MM-DD)</option>
                  <option value="us">US (MM/DD/YYYY)</option>
                  <option value="eu">EU (DD/MM/YYYY)</option>
                </select>
              </div>
              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 shadow-sm cursor-pointer" />
                  <span className="text-[14px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Include suspect/spam variants in CSV exports</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 shadow-sm cursor-pointer" />
                  <span className="text-[14px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Watermark PNG image exports</span>
                </label>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 flex justify-end mt-6">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl text-[14px] hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>

        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-[14px] font-medium flex items-center gap-3 z-50 transition-all">
          Save functionality coming soon
        </div>
      )}
    </AppShell>
  );
}
