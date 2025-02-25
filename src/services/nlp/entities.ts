import { PersonInfo, LocationInfo } from './types';

/**
 * Entity processing utility for extracting people, locations, and organizations
 * using regex patterns instead of NLP libraries to avoid compatibility issues
 */
export class EntityProcessor {
  /**
   * Extract people from text
   */
  extractPeople(text: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Match patterns like "with John", "meet Sarah", "meeting with Mike"
    const nameRegex = /\b(with|meet|meeting with)\s+([A-Z][a-z]+)\b/g;
    let match;
    while ((match = nameRegex.exec(text)) !== null) {
      const name = match[2];
      if (!people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        people.push({ name, role: 'participant' });
      }
    }
    
    // Match other capitalized names that might be people
    const capitalizedNameRegex = /\b([A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?\b/g;
    while ((match = capitalizedNameRegex.exec(text)) !== null) {
      const name = match[0];
      // Skip common words that might be capitalized
      const commonWords = ['I', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!commonWords.includes(name) && 
          !people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        people.push({ name });
      }
    }
    
    return people;
  }
  
  /**
   * Extract locations from text
   */
  extractLocations(text: string): LocationInfo[] {
    const locations: LocationInfo[] = [];
    
    // Match patterns like "at Office", "in New York", "at the Park"
    const locationRegex = /\b(at|in)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b(?!\s+(?:am|pm))/gi;
    let match;
    while ((match = locationRegex.exec(text)) !== null) {
      const name = match[2];
      if (!locations.some(l => l.name.toLowerCase() === name.toLowerCase())) {
        locations.push({ name, type: 'venue' });
      }
    }
    
    return locations;
  }
  
  /**
   * Extract organizations from text
   */
  extractOrganizations(text: string): string[] {
    const organizations: string[] = [];
    
    // Match capitalized multi-word phrases that might be organizations
    const orgRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let match;
    while ((match = orgRegex.exec(text)) !== null) {
      const name = match[0];
      // Skip if already found as a person or location
      if (!organizations.includes(name)) {
        organizations.push(name);
      }
    }
    
    return organizations;
  }
  
  /**
   * Extract all entities from text
   */
  extractEntities(text: string): {
    people: PersonInfo[];
    locations: LocationInfo[];
    organizations: string[];
  } {
    return {
      people: this.extractPeople(text),
      locations: this.extractLocations(text),
      organizations: this.extractOrganizations(text)
    };
  }
}
