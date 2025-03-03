import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  defaultTab, 
  onChange,
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  };

  return (
    <div className={className}>
      <div className="flex border-b border-phanteon-light">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
              activeTab === tab.id
                ? 'text-phanteon-orange border-b-2 border-phanteon-orange'
                : 'text-gray-400 hover:text-white'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};