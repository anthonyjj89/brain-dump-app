import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
}

export default function TabNav({ activeTab, onTabChange, tabs }: TabNavProps) {

  return (
    <nav className="flex justify-center mb-8 bg-slate-800 rounded-lg shadow-xl p-1 border border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
            ${activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'text-gray-300 hover:text-blue-400 hover:bg-slate-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
