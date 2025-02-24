import ContentCard from '../shared/ContentCard';

// This would be replaced with actual data fetching
const mockEvents = [
  {
    id: '1',
    title: 'Team Planning Meeting',
    content: 'Monthly team planning and progress review meeting',
    timestamp: '2024-02-25T09:00:00Z',
    duration: '1 hour',
    location: 'Conference Room A'
  },
  {
    id: '2',
    title: 'Project Demo',
    content: 'Demonstration of new Brain Dump App features to stakeholders',
    timestamp: '2024-02-26T14:00:00Z',
    duration: '30 minutes',
    location: 'Virtual Meeting'
  }
];

export default function EventsView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200">
            New Event
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {mockEvents.map((event) => (
          <ContentCard
            key={event.id}
            title={event.title}
            content={`${event.content}\nDuration: ${event.duration}\nLocation: ${event.location}`}
            type="event"
            timestamp={new Date(event.timestamp).toLocaleString()}
            onAction={() => console.log('Event action clicked')}
            actionLabel="Edit"
          />
        ))}
      </div>

      {mockEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found</p>
        </div>
      )}
    </div>
  );
}
