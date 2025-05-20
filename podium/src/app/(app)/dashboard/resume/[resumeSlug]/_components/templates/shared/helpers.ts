import type { Note } from '../../../queries';

// Find notes for a specific section and text
export const findNotesForItem = (
  notes: Record<string, Note> | Note[], 
  section: string, 
  text: string, 
  field?: string
): Note[] => {
  if (!notes) return [];
  
  // If notes is an array, convert to record for consistent handling
  const notesRecord = Array.isArray(notes) 
    ? notes.reduce<Record<string, Note>>((acc, note) => ({ ...acc, [note.identifier]: note }), {})
    : notes;
  
  return Object.values(notesRecord).filter((note: Note) => {
    // Check if note matches the section
    const sectionMatch = note.section === section;
    
    // Check if note's selected text includes our target text (partial match)
    const textMatch = note.selected_text?.includes(text) || text.includes(note.selected_text || '');
    
    // If field is specified, add extra check for field match in context
    const fieldMatch = !field || (note.context && 
      (note.context.parentElement?.includes(field) || 
       note.context.beforeText?.includes(field) || 
       note.context.afterText?.includes(field))
    );
    
    return sectionMatch && textMatch && fieldMatch;
  });
}; 