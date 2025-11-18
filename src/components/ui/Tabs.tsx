import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  onTabChange?: (tabId: string) => void;
}

export default function Tabs({
  tabs,
  defaultTab,
  className = "",
  tabClassName = "",
  activeTabClassName = "",
  contentClassName = "",
  onTabChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={`bg-background min-h-screen ${className}`}>
      {/* Tab Headers */}
      <div className="px-6 py-4 border-b bg-white">
        <ul className="flex gap-6 text-sm text-gray-600">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                className={`pb-2 transition-colors ${tabClassName} ${
                  activeTab === tab.id
                    ? `border-b-2 border-primary text-primary font-medium ${activeTabClassName}`
                    : "hover:text-gray-800"
                }`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className={`p-6 ${contentClassName}`}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
