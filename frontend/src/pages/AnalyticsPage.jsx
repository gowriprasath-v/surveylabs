import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, FileText, CheckCircle, Star, ArrowRight, Lock } from 'lucide-react';
import AppShell from '../components/layout/AppShell';

// Mock Data for Skeletons
const mockLineData = [
  { name: 'Mon', val: 12 }, { name: 'Tue', val: 35 }, { name: 'Wed', val: 25 },
  { name: 'Thu', val: 68 }, { name: 'Fri', val: 42 }, { name: 'Sat', val: 81 }, { name: 'Sun', val: 104 }
];
const mockBarData = [
  { name: 'Q1', val: 92 }, { name: 'Q4', val: 85 }, { name: 'Q2', val: 78 }, { name: 'Q3', val: 64 }
];
const mockPieData = [
  { name: 'Good', value: 70, color: '#10B981' },
  { name: 'Suspect', value: 20, color: '#F59E0B' },
  { name: 'Spam', value: 10, color: '#EF4444' }
];

const StatCard = ({ title, value, label, icon: Icon, trend }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
        <Icon size={16} className="text-indigo-600" />
      </div>
    </div>
    <div className="flex items-end gap-3">
      <h2 className="text-3xl font-bold text-gray-900 leading-none">{value}</h2>
      {trend && (
        <span className={`text-xs font-semibold mb-0.5 ${trend.dir === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {trend.dir === 'up' ? '↑' : '↓'} {trend.val}
        </span>
      )}
    </div>
    <p className="text-[13px] text-gray-500 mt-2">{label}</p>
  </div>
);

export default function AnalyticsPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* HEADER */}
        <div className="pb-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Global Overview
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Analytics
            </h1>
          </div>
        </div>

        {/* SUMMARY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard title="Total Responses" value="---" label="Across all active surveys" icon={Users} />
          <StatCard title="Active Surveys" value="---" label="Currently collecting data" icon={FileText} />
          <StatCard title="Completion Rate" value="---" label="Average finish rate" icon={CheckCircle} />
          <StatCard title="Avg Rating" value="---" label="Global CSAT score" icon={Star} />
        </div>

        {/* MOCK CHARTS W/ SMART EMPTY STATE OVERLAY */}
        <div className="relative mt-8">
          
          {/* SKELETON LAYER */}
          <div className="space-y-6 opacity-30 select-none pointer-events-none filter blur-[3px] transition-all duration-300">
            {/* OVER TIME WIDE CHART */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-6">Responses Over Time</h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockLineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <Line type="monotone" dataKey="val" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP QUESTIONS */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-6">Top Questions by Engagement</h3>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockBarData} layout="vertical" barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={40} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Bar dataKey="val" fill="#818CF8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* QUALITY BREAKDOWN */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-6">Quality Breakdown</h3>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mockPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {mockPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* EMPTY STATE OVERLAY */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-8 max-w-md w-full text-center px-6 sm:px-10 transition-transform duration-500 scale-100">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5 border border-indigo-100/50">
                <Lock size={24} className="text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Insights Locked</h3>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                We're currently gathering cross-survey benchmarks. Collect more responses to automatically unlock your global analytics dashboard.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
