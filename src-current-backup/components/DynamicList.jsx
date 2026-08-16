import React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { convertImageToBase64, resizeImage } from '../utils/imageUtils';

const DynamicList = ({ title, items, onChange, fields }) => {
  const addItem = () => {
    const newItem = {};
    fields.forEach(field => {
      newItem[field.name] = field.type === 'image' ? null : '';
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleImageUpload = async (index, field, file) => {
    if (file) {
      try {
        const base64 = await convertImageToBase64(file);
        const resized = await resizeImage(base64, 400, 400);
        updateItem(index, field, resized);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-300">{title}</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-dark-lighter p-4 rounded-lg border border-gray-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                {fields.map(field => (
                  <div key={field.name}>
                    {field.type === 'image' ? (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
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
                          <label className="flex items-center gap-2 px-3 py-2 bg-dark-light rounded cursor-pointer hover:bg-gray-700 text-sm">
                            <Upload size={16} />
                            {item[field.name] ? 'Change' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(index, field.name, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          value={item[field.name] || ''}
                          onChange={(e) => updateItem(index, field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full"
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
          <p className="text-gray-500 text-sm text-center py-4">
            No {title.toLowerCase()} added yet. Click "Add" to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default DynamicList;
