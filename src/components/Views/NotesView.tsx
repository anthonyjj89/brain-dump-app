import ContentCard from '../shared/ContentCard';

// This would be replaced with actual data fetching
const mockNotes = [
  {
    id: '1',
    title: 'Project Architecture',
    content: 'Key points about Brain Dump App architecture:\n- Next.js for frontend and API routes\n- MongoDB for data storage\n- AI integration for categorization\n- External service integrations',
    timestamp: '2024-02-24T08:00:00Z',
    tags: ['architecture', 'technical']
  },
  {
    id: '2',
    title: 'Feature Ideas',
    content: 'Future feature ideas:\n- Voice input support\n- Mobile app\n- Browser extension\n- Offline support\n- Rich text editor',
    timestamp: '2024-02-24T09:30:00Z',
    tags: ['roadmap', 'features']
  }
];

export default function NotesView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Notes</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search notes..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 min-w-[200px]"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
            New Note
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {mockNotes.map((note) => (
          <ContentCard
            key={note.id}
            title={note.title}
            content={note.content}
            type="note"
            timestamp={new Date(note.timestamp).toLocaleString()}
            status={note.tags.join(', ')}
            onAction={() => console.log('Note action clicked')}
            actionLabel="Edit"
          />
        ))}
      </div>

      {mockNotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notes found</p>
        </div>
      )}
    </div>
  );
}
