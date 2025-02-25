import { TimeInfo } from './types';

/**
 * Time processing utility for extracting and normalizing dates and times
 */
export class TimeProcessor {
  /**
   * Extract time information from text
   */
  extractTimeInfo(text: string): TimeInfo {
    // Extract dates using our own logic
    const dates = this.extractDates(text);
    
    // Check for specific time patterns that might be missed
    const timePatterns = this.extractTimePatterns(text);
    
    // Check for date references
    const dateReferences = this.extractDateReferences(text);
    
    // Combine the information
    return {
      time: timePatterns.time || (dates[0] ? this.formatTime(dates[0]) : undefined),
      date: dateReferences || (dates[0] ? this.formatDate(dates[0]) : undefined),
      startTime: timePatterns.startTime,
      endTime: timePatterns.endTime,
      isSpecific: dates.length > 0 || !!timePatterns.time || !!dateReferences
    };
  }

  /**
   * Extract time patterns from text
   */
  private extractTimePatterns(text: string): Partial<TimeInfo> {
    const result: Partial<TimeInfo> = {};
    
    // Match patterns like "at 3pm", "at 15:00", etc.
    const timeMatch = text.match(/\b(?:at|by|from|until)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\b/i);
    if (timeMatch) {
      const [_, hour, minute, period] = timeMatch;
      result.time = this.normalizeTime(hour, minute, period);
    }
    
    // Match time ranges like "from 2pm to 4pm"
    const rangeMatch = text.match(/\bfrom\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\b/i);
    if (rangeMatch) {
      const [_, startHour, startMinute, startPeriod, endHour, endMinute, endPeriod] = rangeMatch;
      result.startTime = this.normalizeTime(startHour, startMinute, startPeriod);
      result.endTime = this.normalizeTime(endHour, endMinute, endPeriod);
    }
    
    return result;
  }

  /**
   * Extract date references from text
   */
  private extractDateReferences(text: string): string | undefined {
    // Match common date references
    const dateMatch = text.match(/\b(today|tomorrow|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:this|next)\s+week)\b/i);
    
    return dateMatch ? dateMatch[1] : undefined;
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    
    // Check for "today"
    if (/\btoday\b/i.test(text)) {
      dates.push(new Date());
    }
    
    // Check for "tomorrow"
    if (/\btomorrow\b/i.test(text)) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      dates.push(tomorrow);
    }
    
    // Check for days of the week
    const dayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dayMatch) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(dayMatch[1].toLowerCase());
      
      if (dayOfWeek !== -1) {
        const targetDate = new Date();
        const currentDay = targetDate.getDay();
        let daysToAdd = dayOfWeek - currentDay;
        
        // If the day has already passed this week, go to next week
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        dates.push(targetDate);
      }
    }
    
    return dates;
  }
  
  /**
   * Format a Date object to a time string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Format a Date object to a date string
   */
  private formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    }
    
    // Otherwise return the day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Normalize time components to a standard format
   */
  private normalizeTime(hour: string, minute?: string, period?: string): string {
    let hourNum = parseInt(hour);
    
    // Handle 12-hour vs 24-hour format
    if (period && period.toLowerCase() === 'pm' && hourNum < 12) {
      hourNum += 12;
    } else if (period && period.toLowerCase() === 'am' && hourNum === 12) {
      hourNum = 0;
    } else if (!period) {
      // If no AM/PM specified, make a reasonable guess
      if (hourNum >= 0 && hourNum <= 6) {
        // Early morning hours are likely PM (e.g., "at 5" probably means 5 PM, not 5 AM)
        hourNum += 12;
      }
    }
    
    // Format with leading zeros
    const hour12 = hourNum % 12 || 12;
    const formattedHour = hour12.toString().padStart(2, '0');
    const formattedMinute = minute ? minute : '00';
    const formattedPeriod = hourNum >= 12 ? 'PM' : 'AM';
    
    return `${formattedHour}:${formattedMinute} ${formattedPeriod}`;
  }
}
