import React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';

/**
 * Phone Input Component with reliable country code detection
 * Uses react-phone-number-input library for accurate country detection
 */
const PhoneInput = ({ 
  value, 
  onChange, 
  placeholder = 'Phone number',
  defaultCountry = 'SG',
  className = '',
  required = false,
  error = false,
  onBlur,
  theme = 'dark' // 'dark' or 'light'
}) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`phone-input-wrapper ${className}`}>
      <PhoneInputWithCountry
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onBlur={onBlur}
        flags={flags}
        className={`phone-input-field ${error ? 'phone-input-error' : ''} ${isDark ? 'phone-input-dark' : 'phone-input-light'}`}
      />
      <style>{`
        .phone-input-wrapper {
          width: 100%;
        }
        
        .phone-input-field {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        
        .phone-input-field .PhoneInputInput {
          flex: 1 !important;
          min-width: 0 !important;
        }
        
        /* Dark theme styles */
        .phone-input-dark .PhoneInputCountry {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        
        .phone-input-dark .PhoneInputCountry:hover {
          background: #374151;
        }
        
        .phone-input-dark .PhoneInputInput {
          flex: 1;
          padding: 12px 16px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        
        .phone-input-dark .PhoneInputInput::placeholder {
          color: #6b7280;
        }
        
        .phone-input-dark .PhoneInputInput:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
        
        /* Light theme styles */
        .phone-input-light .PhoneInputCountry {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        
        .phone-input-light .PhoneInputCountry:hover {
          background: #f9fafb;
        }
        
        .phone-input-light .PhoneInputInput {
          flex: 1;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #1f2937;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          width: 100%;
        }
        
        .phone-input-light .PhoneInputInput::placeholder {
          color: #9ca3af;
        }
        
        .phone-input-light .PhoneInputInput:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
        
        /* Common styles */
        .phone-input-field .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .phone-input-field .PhoneInputCountryIcon--border {
          box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        }
        
        .phone-input-field .PhoneInputCountrySelectArrow {
          margin-left: 8px;
          border-color: #9ca3af;
          opacity: 0.7;
        }
        
        .phone-input-field .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .phone-input-error .PhoneInputCountry {
          border-color: #ef4444;
        }
        
        .phone-input-error .PhoneInputInput {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
