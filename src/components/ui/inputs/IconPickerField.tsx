import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
interface IconPickerFieldProps {
  id: string;
  label?: string;
  placeholder?: string;
  error?: { message?: string };
  value?: string; // kebab-case lucide name, e.g. "truck"
  onChange?: (value: string) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const ALL_ICON_NAMES = Object.keys(dynamicIconImports) as IconName[];

export const IconPickerField: React.FC<IconPickerFieldProps> = ({
  id,
  label,
  placeholder = "-- اختر ايقونة --",
  error,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredIcons = React.useMemo(() => {
    if (!searchValue) return ALL_ICON_NAMES.slice(0, 60); // cap initial render
    return ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(searchValue.toLowerCase()),
    ).slice(0, 100);
  }, [searchValue]);

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

  const handleSelect = (name: string) => {
    onChange?.(name);
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
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full border rounded px-3 py-2 flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="flex items-center gap-2">
            {value && (
              <DynamicIcon name={value as IconName} className="w-4 h-4" />
            )}
            {value || placeholder}
          </span>
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
                  placeholder="ابحث..."
                  className="w-full pr-10 pl-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto grid grid-cols-4 gap-1 p-2">
              {filteredIcons.length === 0 ? (
                <div className="col-span-4 px-3 py-8 text-center text-sm text-gray-500">
                  لا توجد نتائج
                </div>
              ) : (
                filteredIcons.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    title={name}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded hover:bg-gray-100 ${
                      value === name ? "bg-gray-100 ring-1 ring-primary" : ""
                    }`}
                  >
                    <DynamicIcon name={name} className="w-5 h-5" />
                    <span className="text-[10px] truncate w-full text-center">
                      {name}
                    </span>
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
