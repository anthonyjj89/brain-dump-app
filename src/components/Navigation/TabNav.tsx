interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface TabNavProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNav({ tabs, currentTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            currentTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
