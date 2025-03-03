import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// Interface to define the expected request body structure
interface FeedbackRequest {
  rating: number;
  feedback?: string;
  summaryId?: string; // Optional: allows for specific summary identification
}

// Interface for feedback item
interface FeedbackItem {
  rating: number;
  feedback: string;
  timestamp: Date;
  summaryId?: string;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json() as FeedbackRequest;
    
    // Validate required fields
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be a number between 1 and 5.' },
        { status: 400 }
      );
    }
    
    // Get the user preferences collection
    const userPreferences = await getCollection('user_preferences');
    
    // Prepare the feedback data without types that might conflict with MongoDB
    const feedbackData = {
      rating: body.rating,
      feedback: body.feedback || '',
      timestamp: new Date(),
      summaryId: body.summaryId
    };
    
    // First create the document if it doesn't exist
    await userPreferences.updateOne(
      { type: 'summary_feedback' },
      { $setOnInsert: { feedbackHistory: [] } },
      { upsert: true }
    );
    
    // Using a separate update with type assertion to bypass TypeScript error
    // This is a workaround for the MongoDB type definitions
    const result = await userPreferences.updateOne(
      { type: 'summary_feedback' },
      {
        $set: { lastUpdated: new Date() },
        $push: { feedbackHistory: feedbackData }
      } as any // Type assertion to bypass TypeScript error
    );
    
    // If a specific summary was referenced, update it too
    if (body.summaryId) {
      const summaries = await getCollection('summaries');
      await summaries.updateOne(
        { generatedAt: body.summaryId },
        {
          $set: {
            feedbackRating: body.rating,
            feedbackText: body.feedback || '',
            feedbackTimestamp: new Date()
          }
        }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Feedback saved successfully',
      data: {
        feedbackId: result.upsertedId || 'updated'
      }
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback history
export async function GET() {
  try {
    const userPreferences = await getCollection('user_preferences');
    
    const preferences = await userPreferences.findOne({ type: 'summary_feedback' });
    
    if (!preferences) {
      return NextResponse.json({ 
        feedbackHistory: [],
        averageRating: null
      });
    }
    
    // Calculate average rating
    const feedbackHistory: FeedbackItem[] = preferences.feedbackHistory || [];
    const averageRating = feedbackHistory.length > 0
      ? feedbackHistory.reduce((acc: number, item: FeedbackItem) => acc + item.rating, 0) / feedbackHistory.length
      : null;
    
    return NextResponse.json({
      feedbackHistory,
      averageRating,
      lastUpdated: preferences.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback history' },
      { status: 500 }
    );
  }
}
