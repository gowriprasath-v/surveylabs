import React from 'react';
import { Wrench } from 'lucide-react';

// NEW
const ComingSoon = ({ title = 'Coming Soon', subtitle }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
    <div className="
      w-16 h-16 rounded-2xl
      bg-white/70 backdrop-blur-md
      border border-gray-200/50
      shadow-sm
      flex items-center justify-center
      mx-auto mb-6
    ">
      <Wrench size={22} className="text-gray-400" />
    </div>
    <h2 className="text-xl font-semibold text-gray-800 mb-2">
      {title}
    </h2>
    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
      {subtitle || 'This feature is under development and will be available soon.'}
    </p>
  </div>
);

export default ComingSoon;
