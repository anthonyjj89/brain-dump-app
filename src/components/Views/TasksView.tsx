import ContentCard from '../shared/ContentCard';

// This would be replaced with actual data fetching
const mockTasks = [
  {
    id: '1',
    title: 'Complete project documentation',
    content: 'Write comprehensive documentation for the Brain Dump App project',
    timestamp: '2024-02-24T10:00:00Z',
    status: 'In Progress'
  },
  {
    id: '2',
    title: 'Review pull requests',
    content: 'Review and merge pending pull requests for the main branch',
    timestamp: '2024-02-24T11:00:00Z',
    status: 'Pending'
  }
];

export default function TasksView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200">
            New Task
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {mockTasks.map((task) => (
          <ContentCard
            key={task.id}
            title={task.title}
            content={task.content}
            type="task"
            timestamp={new Date(task.timestamp).toLocaleString()}
            status={task.status}
            onAction={() => console.log('Task action clicked')}
            actionLabel="Complete"
          />
        ))}
      </div>

      {mockTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}
