import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, CheckSquare, Calendar, FileText } from "lucide-react";
import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

// Helper function to get the icon component by id
const getIconComponent = (id: string, className: string = "h-4 w-4"): ReactNode => {
  switch (id) {
    case 'all':
      return <LayoutList className={className} />;
    case 'tasks':
      return <CheckSquare className={className} />;
    case 'events':
      return <Calendar className={className} />;
    case 'notes':
      return <FileText className={className} />;
    default:
      return null;
  }
};

interface TabNavProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNav({ tabs, currentTab, onTabChange }: TabNavProps) {
  return (
    <Tabs
      defaultValue={currentTab}
      value={currentTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-4 bg-card">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            className="flex items-center justify-center gap-2 py-2 transition-all data-[state=active]:text-primary"
          >
            <span className="flex items-center justify-center transition-all data-[state=active]:text-primary">
              {getIconComponent(tab.id)}
            </span>
            <span className="text-sm">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
