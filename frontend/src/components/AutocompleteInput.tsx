import React, { useState, useEffect } from 'react';
import { useCombobox } from 'downshift';
import axios from 'axios';

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  endpoint: string; // endpoint relativo, ej: '/api/autocomplete/institutions'
  placeholder?: string;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  value,
  onChange,
  endpoint,
  placeholder,
  disabled,
}) => {
  const [inputItems, setInputItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (inputValue: string) => {
    setLoading(true);
    try {
      const res = await axios.get(endpoint, { params: { query: inputValue } });
      setInputItems(res.data);
    } catch {
      setInputItems([]);
    } finally {
      setLoading(false);
    }
  };

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    setInputValue,
  } = useCombobox({
    inputValue: value,
    items: inputItems,
    onInputValueChange: ({ inputValue }) => {
      onChange(inputValue || '');
      if (inputValue && inputValue.length > 1) {
        fetchSuggestions(inputValue);
      } else {
        setInputItems([]);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem);
    },
  });

  useEffect(() => {
    if (value && value.length > 1) {
      fetchSuggestions(value);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          {...getInputProps({
            placeholder: placeholder || '',
            disabled,
            className:
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3',
          })}
        />
        {loading && (
          <span className="absolute right-3 top-2 text-gray-400 animate-spin">⏳</span>
        )}
        <ul
          {...getMenuProps()}
          className={`absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto transition-all duration-100 ${
            isOpen && inputItems.length > 0 ? '' : 'hidden'
          }`}
        >
          {isOpen &&
            inputItems.map((item, index) => (
              <li
                key={item}
                {...getItemProps({ item, index })}
                className={`cursor-pointer px-4 py-2 text-sm ${{
                  true: 'hover:bg-indigo-100',
                  false: '',
                }[String(highlightedIndex === index)]} ${
                  highlightedIndex === index ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
              >
                {item}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default AutocompleteInput; 