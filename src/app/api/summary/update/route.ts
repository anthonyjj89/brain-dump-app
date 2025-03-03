import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Process natural language input to update tasks and events
export async function POST(request: Request) {
  try {
    const { input, summaryId } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }
    
    // In a production app, we would call an AI model to parse the input
    // For this demo, we'll implement some simple regex-based parsing
    
    // Parse the natural language input to identify actions
    const actions = parseInput(input);
    
    // Update database based on the actions
    const updateResults = await applyUpdates(actions);
    
    return NextResponse.json({
      status: 'success',
      message: 'Updates applied successfully',
      actions,
      updateResults
    });
    
  } catch (error) {
    console.error('Error updating summary items:', error);
    return NextResponse.json(
      { error: 'Failed to process update request' },
      { status: 500 }
    );
  }
}

interface UpdateAction {
  type: 'reschedule' | 'complete' | 'modify' | 'unknown';
  itemType?: 'task' | 'event';
  itemTitle?: string;
  newDate?: string;
  newTime?: string;
  newTitle?: string;
  originalText: string;
}

// Parse the input to identify update actions
function parseInput(input: string): UpdateAction[] {
  const actions: UpdateAction[] = [];
  const lowerInput = input.toLowerCase();
  
  // Check for rescheduling events
  const rescheduleMatches = lowerInput.match(/(?:move|reschedule|change)\s+(?:the\s+)?(?:meeting|call|appointment|event)(?:\s+with\s+(\w+))?\s+to\s+([a-z]+|tomorrow|next week)(?:\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/gi);
  
  if (rescheduleMatches) {
    rescheduleMatches.forEach(match => {
      // Extract event details
      const personMatch = match.match(/with\s+(\w+)/i);
      const dateMatch = match.match(/to\s+([a-z]+|tomorrow|next week)/i);
      const timeMatch = match.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      
      actions.push({
        type: 'reschedule',
        itemType: 'event',
        itemTitle: personMatch ? `Meeting with ${personMatch[1]}` : undefined,
        newDate: dateMatch ? dateMatch[1] : undefined,
        newTime: timeMatch ? timeMatch[1] : undefined,
        originalText: match
      });
    });
  }
  
  // Check for completing tasks
  const completeMatches = lowerInput.match(/(?:mark|set|complete)\s+(?:the\s+)?(?:task|item|todo|to-do)?\s*([^,\.]+)(?:\s+as\s+)?(?:done|complete|completed|finished)/gi);
  
  if (completeMatches) {
    completeMatches.forEach(match => {
      const taskNameMatch = match.match(/(?:mark|set|complete)\s+(?:the\s+)?(?:task|item|todo|to-do)?\s*([^,\.]+)(?:\s+as\s+)?(?:done|complete|completed|finished)/i);
      
      actions.push({
        type: 'complete',
        itemType: 'task',
        itemTitle: taskNameMatch?.[1]?.trim(),
        originalText: match
      });
    });
  }
  
  // Check for modifying task or event titles
  const modifyMatches = lowerInput.match(/(?:change|rename|update)\s+(?:the\s+)?(?:task|event|meeting|todo)?\s*([^,\.]+)(?:\s+to\s+|"?)([^"\.]+)(?:"|\.)/gi);
  
  if (modifyMatches) {
    modifyMatches.forEach(match => {
      const detailsMatch = match.match(/(?:change|rename|update)\s+(?:the\s+)?(?:task|event|meeting|todo)?\s*([^,\.]+)(?:\s+to\s+|"?)([^"\.]+)(?:"|\.)/i);
      
      if (detailsMatch) {
        const oldTitle = detailsMatch[1].trim();
        const newTitle = detailsMatch[2].trim();
        
        actions.push({
          type: 'modify',
          itemTitle: oldTitle,
          newTitle: newTitle,
          originalText: match
        });
      }
    });
  }
  
  // If no patterns matched, add an "unknown" action
  if (actions.length === 0) {
    actions.push({
      type: 'unknown',
      originalText: input
    });
  }
  
  return actions;
}

// Apply the updates to the database
async function applyUpdates(actions: UpdateAction[]) {
  const thoughts = await getCollection('thoughts');
  const results = [];
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'reschedule': {
          // Find the event to update (using partial title match)
          const eventQuery = action.itemTitle
            ? { thoughtType: 'event', 'processedContent.title': { $regex: action.itemTitle, $options: 'i' } }
            : { thoughtType: 'event' };
          
          const event = await thoughts.findOne(eventQuery);
          
          if (event) {
            // Update the event with new date/time
            const update: any = { 'updatedAt': new Date() };
            
            if (action.newDate) {
              update['processedContent.eventDate'] = action.newDate;
              update['processedContent.date'] = action.newDate;
            }
            
            if (action.newTime) {
              update['processedContent.eventTime'] = action.newTime;
              update['processedContent.time'] = action.newTime;
            }
            
            await thoughts.updateOne(
              { _id: event._id },
              { $set: update }
            );
            
            results.push({
              action,
              success: true,
              itemId: event._id.toString(),
              message: 'Event rescheduled successfully'
            });
          } else {
            results.push({
              action,
              success: false,
              message: 'No matching event found'
            });
          }
          break;
        }
        
        case 'complete': {
          // Find the task to complete
          const taskQuery = action.itemTitle
            ? { thoughtType: 'task', 'processedContent.title': { $regex: action.itemTitle, $options: 'i' } }
            : { thoughtType: 'task' };
          
          const task = await thoughts.findOne(taskQuery);
          
          if (task) {
            // Mark the task as completed
            await thoughts.updateOne(
              { _id: task._id },
              { 
                $set: { 
                  'completedAt': new Date(),
                  'isCompleted': true,
                  'updatedAt': new Date()
                } 
              }
            );
            
            results.push({
              action,
              success: true,
              itemId: task._id.toString(),
              message: 'Task marked as completed'
            });
          } else {
            results.push({
              action,
              success: false,
              message: 'No matching task found'
            });
          }
          break;
        }
        
        case 'modify': {
          // Find the item to modify
          const item = await thoughts.findOne({ 
            'processedContent.title': { $regex: action.itemTitle, $options: 'i' } 
          });
          
          if (item) {
            // Update the item title
            await thoughts.updateOne(
              { _id: item._id },
              { 
                $set: { 
                  'processedContent.title': action.newTitle,
                  'updatedAt': new Date()
                } 
              }
            );
            
            results.push({
              action,
              success: true,
              itemId: item._id.toString(),
              message: `${item.thoughtType === 'task' ? 'Task' : 'Event'} title updated`
            });
          } else {
            results.push({
              action,
              success: false,
              message: 'No matching item found'
            });
          }
          break;
        }
        
        case 'unknown':
        default:
          results.push({
            action,
            success: false,
            message: 'Could not understand the requested action'
          });
          break;
      }
    } catch (error) {
      console.error(`Error processing action ${action.type}:`, error);
      results.push({
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}
