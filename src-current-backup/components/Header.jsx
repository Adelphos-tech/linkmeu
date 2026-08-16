import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Header = ({ title, showBack = false, rightAction = null }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">EX</span>
            </div>
            <p className="text-xs text-gray-400">EventsX - Powered by Robocorp</p>
          </div>
        </div>
        {title && (
          <h1 className="text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h1>
        )}
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};

export default Header;
