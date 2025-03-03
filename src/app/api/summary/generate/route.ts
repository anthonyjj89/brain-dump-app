import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to format date
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Convert relative date to absolute date
function getAbsoluteDate(relativeDate: string): Date {
  const today = new Date();
  const lowerDate = relativeDate.toLowerCase();
  
  if (lowerDate.includes('today')) {
    return today;
  } else if (lowerDate.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  } else if (lowerDate.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  } else if (lowerDate.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/)) {
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };
    
    // Extract day name from the text
    const dayMatch = lowerDate.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/);
    if (!dayMatch) return today;
    
    const targetDay = dayMap[dayMatch[0]];
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    
    // If the day has already passed this week, set it for next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const result = new Date(today);
    result.setDate(today.getDate() + daysToAdd);
    return result;
  }
  
  // Try to parse as a date string
  const parsedDate = new Date(relativeDate);
  return isNaN(parsedDate.getTime()) ? today : parsedDate;
}

// Helper function to determine priority based on content and context
function determineTaskPriority(task: any): 'high' | 'medium' | 'low' {
  const content = task.content?.toLowerCase() || '';
  const title = task.processedContent?.title?.toLowerCase() || '';
  const combinedText = content + ' ' + title;
  
  // Financial or deadline tasks are high priority
  if (
    combinedText.includes('invoice') || 
    combinedText.includes('payment') || 
    combinedText.includes('urgent') || 
    combinedText.includes('asap') || 
    combinedText.includes('immediately') ||
    combinedText.includes('deadline') ||
    combinedText.includes('due today')
  ) {
    return 'high';
  }
  
  // Work and client related tasks are medium priority
  if (
    combinedText.includes('client') || 
    combinedText.includes('meeting') || 
    combinedText.includes('project') ||
    combinedText.includes('work') ||
    combinedText.includes('report')
  ) {
    return 'medium';
  }
  
  return 'low';
}

// Helper function to get time from a task or event
function getTimeFromItem(item: any): string | undefined {
  // Try different possible fields
  return (
    item.processedContent?.eventTime ||
    item.processedContent?.time ||
    item.processedContent?.dueTime
  );
}

// Helper function to get date from a task or event
function getDateFromItem(item: any): string | undefined {
  // Try different possible fields
  return (
    item.processedContent?.eventDate ||
    item.processedContent?.date ||
    item.processedContent?.dueDate
  );
}

// Check if an event or task is for today
function isToday(item: any): boolean {
  const dateStr = getDateFromItem(item)?.toLowerCase();
  if (!dateStr) return false;
  
  // Check if it explicitly mentions today
  if (dateStr.includes('today')) {
    return true;
  }
  
  // Try to parse the date and compare with today
  try {
    const itemDate = getAbsoluteDate(dateStr);
    const today = new Date();
    
    return itemDate.getDate() === today.getDate() &&
           itemDate.getMonth() === today.getMonth() &&
           itemDate.getFullYear() === today.getFullYear();
  } catch (error) {
    // If parsing fails, fall back to string comparison
    return dateStr.includes(formatDate(new Date()).toLowerCase());
  }
}

// Get a formatted date and time for an event
function getFormattedDateTime(item: any): { formattedDate: string, formattedTime: string | undefined } {
  const dateStr = getDateFromItem(item);
  const timeStr = getTimeFromItem(item);
  
  if (!dateStr) {
    return { formattedDate: formatDate(new Date()), formattedTime: timeStr };
  }
  
  try {
    const date = getAbsoluteDate(dateStr);
    return { 
      formattedDate: formatDate(date),
      formattedTime: timeStr 
    };
  } catch (error) {
    return { formattedDate: dateStr, formattedTime: timeStr };
  }
}

// Check if task looks finance-related
function isFinanceRelated(task: any): boolean {
  const content = (task.content || '').toLowerCase();
  const title = (task.processedContent?.title || '').toLowerCase();
  const combinedText = content + ' ' + title;
  
  const financeKeywords = [
    'invoice', 'payment', 'bill', 'finance', 'money', 
    'tax', 'receipt', 'account', 'budget', 'expense',
    'pay', 'financial', 'bank', 'credit', 'debit'
  ];
  
  return financeKeywords.some(keyword => combinedText.includes(keyword));
}

export async function GET() {
  try {
    // Get thoughts from database
    const thoughts = await getCollection('thoughts');
    
    // Current date
    const today = new Date();
    const formattedDate = formatDate(today);
    
    // Get all approved events and tasks
    const approvedItems = await thoughts.find({
      status: 'approved',
      thoughtType: { $in: ['event', 'task'] }
    }).toArray();
    
    // Extract events (focus on today's events)
    const todaysEvents = approvedItems
      .filter(item => item.thoughtType === 'event' && isToday(item))
      .map(event => {
        const { formattedDate, formattedTime } = getFormattedDateTime(event);
        return {
          id: event._id.toString(),
          title: event.processedContent?.title || event.content,
          time: formattedTime,
          date: formattedDate,
          location: event.processedContent?.location,
          person: event.processedContent?.person,
          isoDate: getAbsoluteDate(
            getDateFromItem(event) || formatDate(new Date())
          ).toISOString()
        };
      })
      .sort((a, b) => {
        // Sort by time if available
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      });
    
    // Extract tasks
    const allTasks = approvedItems
      .filter(item => item.thoughtType === 'task')
      .map(task => {
        // Get the due date as absolute date if possible
        let isoDueDate = undefined;
        const dueDate = task.processedContent?.dueDate;
        
        if (dueDate) {
          try {
            isoDueDate = getAbsoluteDate(dueDate).toISOString();
          } catch (error) {
            // If parsing fails, keep original
          }
        }
        
        return {
          id: task._id.toString(),
          title: task.processedContent?.title || task.content,
          priority: task.processedContent?.priority || determineTaskPriority(task),
          dueDate: task.processedContent?.dueDate,
          dueTime: task.processedContent?.dueTime,
          isFinanceRelated: isFinanceRelated(task),
          isoDueDate
        };
      });
    
    // Prioritize tasks
    const prioritizedTasks = [...allTasks].sort((a, b) => {
      // First prioritize finance-related tasks
      if (a.isFinanceRelated && !b.isFinanceRelated) return -1;
      if (!a.isFinanceRelated && b.isFinanceRelated) return 1;
      
      // Then by explicit priority
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aWeight = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const bWeight = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      if (aWeight !== bWeight) return bWeight - aWeight;
      
      // Then by due date (if it's today, it's more important)
      const aIsToday = a.dueDate?.toLowerCase().includes('today') || false;
      const bIsToday = b.dueDate?.toLowerCase().includes('today') || false;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      return 0;
    });
    
    // Create the summary data
    const summaryData = {
      events: todaysEvents,
      prioritizedTasks: prioritizedTasks.map(({ isFinanceRelated, ...rest }) => rest), // Remove the helper field
      date: formattedDate,
      generatedAt: new Date().toISOString()
    };
    
    // Save the summary in the database for future reference
    const summaries = await getCollection('summaries');
    await summaries.insertOne({
      ...summaryData,
      createdAt: new Date(),
      feedbackRating: null,
      feedbackText: null
    });
    
    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
