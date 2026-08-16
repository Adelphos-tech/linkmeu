import React, { useState } from 'react';
import { Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { convertImageToBase64, resizeImage } from '../utils/imageUtils';

const MAX_ITEMS = 20;
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const DynamicList = ({ title, items, onChange, fields, maxItems = MAX_ITEMS }) => {
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState({});

  const addItem = () => {
    if (items.length >= maxItems) {
      setErrors({ general: `Maximum ${maxItems} items allowed` });
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    const newItem = {};
    fields.forEach(field => {
      newItem[field.name] = field.type === 'image' ? null : '';
    });
    onChange([...items, newItem]);
    setErrors({});
  };

  const removeItem = (index) => {
    // Check if item has any content
    const item = items[index];
    const hasContent = fields.some(field => {
      const value = item[field.name];
      return value && (typeof value === 'string' ? value.trim() : true);
    });
    
    if (hasContent) {
      if (!window.confirm('Are you sure you want to remove this item?')) {
        return;
      }
    }
    
    onChange(items.filter((_, i) => i !== index));
    // Clear any errors for this index
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleImageUpload = async (index, field, file) => {
    if (!file) return;
    
    const errorKey = `${index}-${field}`;
    
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        [errorKey]: `Invalid type. Use: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}` 
      }));
      return;
    }
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      setErrors(prev => ({ 
        ...prev, 
        [errorKey]: `File too large. Max: ${MAX_IMAGE_SIZE_MB}MB` 
      }));
      return;
    }
    
    setUploading(prev => ({ ...prev, [errorKey]: true }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
    
    try {
      const base64 = await convertImageToBase64(file);
      const resized = await resizeImage(base64, 400, 400);
      updateItem(index, field, resized);
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, [errorKey]: 'Failed to process image' }));
    } finally {
      setUploading(prev => ({ ...prev, [errorKey]: false }));
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">{title}</label>
          <span className="text-xs text-gray-400">({items.length}/{maxItems})</span>
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= maxItems}
          className={`flex items-center gap-1 font-medium text-sm ${
            items.length >= maxItems 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-red-600 hover:text-red-700'
          }`}
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                {fields.map(field => (
                  <div key={field.name}>
                    {field.type === 'image' ? (
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">
                          {field.label}
                        </label>
                        <div className="flex items-center gap-3">
                          {item[field.name] && (
                            <img
                              src={item[field.name]}
                              alt={field.label}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <label className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-700 ${
                            uploading[`${index}-${field.name}`] ? 'opacity-50 cursor-wait' : ''
                          }`}>
                            <Upload size={16} />
                            {uploading[`${index}-${field.name}`] 
                              ? 'Uploading...' 
                              : item[field.name] ? 'Change' : 'Upload'
                            }
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading[`${index}-${field.name}`]}
                              onChange={(e) => handleImageUpload(index, field.name, e.target.files[0])}
                            />
                          </label>
                        </div>
                        {errors[`${index}-${field.name}`] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors[`${index}-${field.name}`]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          value={item[field.name] || ''}
                          onChange={(e) => updateItem(index, field.name, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-400 mt-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
            No {title.toLowerCase()} added yet. Click "Add" to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default DynamicList;
