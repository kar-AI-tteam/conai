import { QAItem } from '../types/qa';

const STORAGE_KEY = 'contour_ai_entries';

const getStorageKey = (userId?: string): string => {
  alert(userId)
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
};

export const loadEntriesFromStorage = async (userId?: string): Promise<QAItem[]> => {
  try {
    alert(userId)
    const data = localStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
};

export const searchEntries = async (query: string): Promise<Array<{ entry: QAItem; score: number; highlights: any }>> => {
  try {
    const entries = await loadEntriesFromStorage();
    const normalizedQuery = query.toLowerCase().trim();
    
    return entries.map(entry => ({
      entry,
      score: calculateScore(entry, normalizedQuery),
      highlights: getHighlights(entry, normalizedQuery)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error searching entries:', error);
    return [];
  }
};

const calculateScore = (entry: QAItem, query: string): number => {
  let score = 0;
  
  if (entry.question.toLowerCase().includes(query)) {
    score += 50;
  }
  
  if (entry.keywords.some(kw => kw.toLowerCase().includes(query))) {
    score += 30;
  }
  
  if (entry.answer.toLowerCase().includes(query)) {
    score += 20;
  }
  
  return score;
};

const getHighlights = (entry: QAItem, query: string): any => {
  const highlights: any = {};
  
  if (entry.question.toLowerCase().includes(query)) {
    highlights.question = [entry.question];
  }
  
  if (entry.answer.toLowerCase().includes(query)) {
    highlights.answer = [entry.answer];
  }
  
  const matchingKeywords = entry.keywords.filter(kw => 
    kw.toLowerCase().includes(query)
  );
  if (matchingKeywords.length > 0) {
    highlights.keywords = matchingKeywords;
  }
  
  return highlights;
};

export const addEntryToStorage = async (entry: QAItem, userId?: string): Promise<void> => {
  try {
    const entries = await loadEntriesFromStorage(userId);
    const newEntry = {
      ...entry,
      id: entry.id || `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    entries.push(newEntry);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(entries));
  } catch (error) {
    console.error('Error adding entry:', error);
  }
};

export const updateEntryInStorage = async (entry: QAItem, userId?: string): Promise<void> => {
  try {
    const entries = await loadEntriesFromStorage(userId);
    const index = entries.findIndex(e => e.id === entry.id);
    
    if (index === -1) {
      await addEntryToStorage(entry, userId);
      return;
    }

    entries[index] = {
      ...entry,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(getStorageKey(userId), JSON.stringify(entries));
  } catch (error) {
    console.error('Error updating entry:', error);
  }
};

export const deleteEntryFromStorage = async (entryId: string, userId?: string): Promise<void> => {
  try {
    const entries = await loadEntriesFromStorage(userId);
    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filteredEntries));
  } catch (error) {
    console.error('Error deleting entry:', error);
  }
};