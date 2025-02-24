import ThoughtForm from '@/components/ThoughtForm';
import ReviewCards from '@/components/ReviewCards';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Brain Dump App</h1>
          <span className="text-sm text-gray-500">v0.1.3</span>
        </div>
        
        {/* Thought Input Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dump Your Thoughts</h2>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <ThoughtForm />
          </div>
        </section>

        {/* Review Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Review Cards</h2>
          <ReviewCards />
        </section>

        {/* Quick Info */}
        <section className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">How it works</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Type or speak your thoughts</li>
            <li>AI automatically categorizes them</li>
            <li>Review and approve the categorized items</li>
            <li>Approved items sync to your preferred services:
              <ul className="ml-6 mt-1 list-disc list-inside text-blue-700">
                <li>Tasks → TickTick</li>
                <li>Events → Google Calendar</li>
                <li>Notes → Notion</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Admin Panel */}
        <AdminPanel />
      </div>
    </main>
  );
}
