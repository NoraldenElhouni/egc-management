import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

type Option = { value: string; label: string };

interface SearchableSelectFieldProps {
  id: string;
  label?: string;
  placeholder?: string;
  error?: { message?: string };
  options: Option[];
  loading?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

export const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  id,
  label,
  placeholder = "-- اختر --",
  error,
  options,
  loading,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (loading) return [];
    if (!searchValue) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue, loading]);

  useEffect(() => {
    if (value) {
      const selected = options.find((opt) => opt.value === value);
      setSelectedLabel(selected?.label || "");
    } else {
      setSelectedLabel("");
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChange?.(option.value);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearchValue("");
  };

  return (
    <div className="flex flex-col">
      {!hideLabel && label && (
        <label htmlFor={id} className="mb-1 text-sm text-foreground">
          {label}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border rounded px-3 py-2 text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {selectedLabel || placeholder}
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={loading || disabled}
                  placeholder="ابحث..."
                  className="w-full pr-10 pl-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  جاري التحميل...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  لا توجد نتائج
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-right px-3 py-2 hover:bg-gray-100 ${
                      value === option.value ? "bg-gray-50" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
