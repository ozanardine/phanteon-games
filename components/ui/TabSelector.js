import React from 'react';

export default function TabSelector({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex overflow-x-auto pb-2 scrollbar-hide ${className}`}>
      <div className="flex bg-dark-400 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center px-4 py-2 min-w-[100px] rounded-md text-sm font-medium transition-all
            ${activeTab === tab.id 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-dark-300'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
