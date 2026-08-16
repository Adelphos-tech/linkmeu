import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Header = ({ title, showBack = false, rightAction = null }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div 
            className="cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">Link</span>
              <span className="text-xl font-bold text-red-500">Me</span>
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <p className="text-[9px] text-gray-400 -mt-0.5 tracking-wide">Link Me You Matter Most.</p>
          </div>
        </div>
        {title && (
          <h1 className="text-lg font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h1>
        )}
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};

export default Header;
