import { QAItem } from '../../types/qa';
import { QUESTION_PREFIXES } from '../constants/questionPrefixes';

export interface SearchResult {
  entry: QAItem;
  score: number;
  highlights: any;
}

export class SearchEngine {
  private static readonly MINIMUM_MATCH_THRESHOLD = 25;
  private static readonly KEYWORD_MATCH_WEIGHT = 0.4;
  private static readonly QUESTION_MATCH_WEIGHT = 0.6;
  private static readonly MAX_INITIAL_RESULTS = 2;

  // Common words to ignore or give lower weight
  private static readonly STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
    'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
    'that', 'the', 'to', 'was', 'were', 'will', 'with', 'the',
    'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where',
    'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'cannot', 'could', 'may', 'might', 'must', 'need',
    'ought', 'shall', 'should', 'would', 'give', 'me', 'my',
    'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves'
  ]);

  private static readonly MATCH_WEIGHTS = {
    EXACT_MATCH: 100,         // Exact string match
    WORD_MATCH_ALL: 90,       // All words match in any order
    WORD_MATCH_MOST: 70,      // Most words match (>75%)
    WORD_MATCH_SOME: 50,      // Some words match (>50%)
    WORD_MATCH_FEW: 30,       // Few words match (>25%)
    PARTIAL_WORD_MATCH: 20    // Some partial word matches
  };

  static search(entries: QAItem[], query: string): SearchResult[] {
    if (!Array.isArray(entries)) {
      console.error('Invalid entries array:', entries);
      return [];
    }

    if (!query || typeof query !== 'string') {
      console.error('Invalid query:', query);
      return [];
    }

    try {
      console.log('Original query:', query);
      
      // Remove question prefixes and normalize
      const cleanQuery = this.removeQuestionPrefixes(query);
      if (!cleanQuery.trim()) {
        console.log('Query is empty after removing prefixes');
        return [];
      }

      const normalizedQuery = this.normalizeText(cleanQuery);
      const queryWords = this.extractSearchTerms(normalizedQuery);
      
      console.log('Cleaned query:', cleanQuery);
      console.log('Normalized query:', normalizedQuery);
      console.log('Query words:', queryWords);

      // If query is too short or nonsensical after cleaning, return no results
      if (queryWords.length === 0 || this.isNonsensicalQuery(queryWords)) {
        console.log('Query is too short or nonsensical');
        return [];
      }

      // Get significant words (non-stop words) from the query
      const significantQueryWords = queryWords.filter(word => !this.STOP_WORDS.has(word));
      console.log('Significant query words:', significantQueryWords);

      const results = entries
        .filter(entry => this.isValidEntry(entry))
        .map(entry => {
          try {
            const score = this.calculateMatchScore(entry, queryWords, significantQueryWords, normalizedQuery);
            return {
              entry,
              score,
              highlights: this.getHighlights(entry, significantQueryWords, normalizedQuery)
            };
          } catch (error) {
            console.error('Error calculating match score for entry:', entry, error);
            return null;
          }
        })
        .filter((result): result is SearchResult => 
          result !== null && result.score >= this.MINIMUM_MATCH_THRESHOLD
        )
        .sort((a, b) => b.score - a.score);

      console.log(`Found ${results.length} results above threshold`);
      return results;
    } catch (error) {
      // Improved error logging with more context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        message: errorMessage,
        query,
        entriesCount: entries?.length,
        timestamp: new Date().toISOString()
      };
      console.error('Search error:', errorDetails);
      return [];
    }
  }

  private static isValidEntry(entry: QAItem): boolean {
    if (!entry) return false;
    if (typeof entry.question !== 'string' || !entry.question.trim()) return false;
    if (!Array.isArray(entry.keywords)) return false;
    return true;
  }

  private static calculateMatchScore(
    entry: QAItem, 
    queryWords: string[], 
    significantQueryWords: string[],
    normalizedQuery: string
  ): number {
    try {
      const normalizedQuestion = this.normalizeText(entry.question);
      const normalizedKeywords = entry.keywords.map(k => this.normalizeText(k));
      const questionWords = this.extractSearchTerms(normalizedQuestion);
      const significantQuestionWords = questionWords.filter(word => !this.STOP_WORDS.has(word));

      let score = 0;

      // Check for exact matches first (highest priority)
      if (normalizedQuestion === normalizedQuery) {
        return this.MATCH_WEIGHTS.EXACT_MATCH;
      }

      if (normalizedKeywords.includes(normalizedQuery)) {
        return this.MATCH_WEIGHTS.EXACT_MATCH;
      }

      // Calculate significant word matches (higher weight)
      const significantMatches = significantQueryWords.filter(word => 
        significantQuestionWords.some(qWord => 
          qWord === word || qWord.includes(word) || word.includes(qWord)
        )
      );

      const significantMatchRatio = significantQueryWords.length > 0 
        ? significantMatches.length / significantQueryWords.length 
        : 0;

      // Calculate regular word matches (lower weight)
      const regularMatches = queryWords.filter(word => 
        questionWords.some(qWord => qWord === word)
      );

      const regularMatchRatio = queryWords.length > 0 
        ? regularMatches.length / queryWords.length 
        : 0;

      // Calculate consecutive word matches (bonus points)
      const consecutiveMatches = this.findConsecutiveMatches(
        significantQueryWords,
        significantQuestionWords
      );

      // Calculate final score with weighted components
      if (significantMatchRatio === 1 && consecutiveMatches > 0) {
        score = this.MATCH_WEIGHTS.WORD_MATCH_ALL;
      } else if (significantMatchRatio >= 0.75) {
        score = this.MATCH_WEIGHTS.WORD_MATCH_MOST;
      } else if (significantMatchRatio >= 0.5) {
        score = this.MATCH_WEIGHTS.WORD_MATCH_SOME;
      } else if (significantMatchRatio >= 0.25) {
        score = this.MATCH_WEIGHTS.WORD_MATCH_FEW;
      } else if (regularMatchRatio > 0) {
        score = this.MATCH_WEIGHTS.PARTIAL_WORD_MATCH;
      }

      // Add bonus for consecutive matches
      if (consecutiveMatches > 1) {
        score += Math.min(consecutiveMatches * 5, 20);
      }

      // Check keyword matches
      const keywordMatches = significantQueryWords.filter(word =>
        normalizedKeywords.some(keyword =>
          keyword === word || keyword.includes(word)
        )
      );

      if (keywordMatches.length > 0) {
        const keywordScore = (keywordMatches.length / significantQueryWords.length) * this.MATCH_WEIGHTS.WORD_MATCH_MOST;
        score = Math.max(score, keywordScore);
      }

      // Log scoring details for debugging
      console.log('Scoring details:', {
        question: entry.question,
        significantMatchRatio,
        regularMatchRatio,
        consecutiveMatches,
        keywordMatches,
        finalScore: score
      });

      return score;
    } catch (error) {
      console.error('Error calculating match score:', error);
      return 0;
    }
  }

  private static findConsecutiveMatches(queryWords: string[], textWords: string[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (let i = 0; i < queryWords.length; i++) {
      for (let j = 0; j < textWords.length; j++) {
        if (textWords[j].includes(queryWords[i])) {
          currentConsecutive++;
          if (currentConsecutive > maxConsecutive) {
            maxConsecutive = currentConsecutive;
          }
        } else {
          currentConsecutive = 0;
        }
      }
    }
    
    return maxConsecutive;
  }

  private static removeQuestionPrefixes(query: string): string {
    if (!query) return '';
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Sort prefixes by length (longest first) to handle overlapping prefixes
    const sortedPrefixes = QUESTION_PREFIXES.sort((a, b) => b.length - a.length);
    
    for (const prefix of sortedPrefixes) {
      if (normalizedQuery.startsWith(prefix + ' ')) {
        return normalizedQuery.substring(prefix.length).trim();
      }
    }
    
    return normalizedQuery;
  }

  private static isNonsensicalQuery(queryWords: string[]): boolean {
    if (!Array.isArray(queryWords)) return true;
    
    // Check if all words are stop words
    const hasSignificantWords = queryWords.some(word => !this.STOP_WORDS.has(word));
    if (!hasSignificantWords) return true;
    
    return queryWords.every(word => 
      !word || 
      word.length < 2 || 
      !/[a-zA-Z]/.test(word) || 
      /^[aeiou]+$/i.test(word)
    );
  }

  private static extractSearchTerms(text: string): string[] {
    if (!text) return [];
    return text
      .split(/\s+/)
      .filter(word => word && word.length >= 2)
      .map(word => this.normalizeText(word));
  }

  private static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static getHighlights(entry: QAItem, significantWords: string[], fullQuery: string): any {
    try {
      const highlights: any = {};

      // Only highlight significant words
      const matchingKeywords = entry.keywords.filter(keyword => {
        const normalizedKeyword = this.normalizeText(keyword);
        return normalizedKeyword === fullQuery ||
               significantWords.some(word => normalizedKeyword.includes(word));
      });

      if (matchingKeywords.length > 0) {
        highlights.keywords = matchingKeywords;
      }

      const normalizedQuestion = this.normalizeText(entry.question);
      if (normalizedQuestion.includes(fullQuery) ||
          significantWords.some(word => normalizedQuestion.includes(word))) {
        highlights.question = [this.highlightMatches(entry.question, significantWords, fullQuery)];
      }

      return highlights;
    } catch (error) {
      console.error('Error generating highlights:', error);
      return {};
    }
  }

  private static highlightMatches(text: string, significantWords: string[], fullQuery: string): string {
    try {
      let highlighted = text;

      // Highlight full query matches first
      const fullQueryRegex = new RegExp(`(${this.escapeRegExp(fullQuery)})`, 'gi');
      highlighted = highlighted.replace(fullQueryRegex, '**$1**');

      // Then highlight individual significant word matches
      significantWords
        .sort((a, b) => b.length - a.length) // Match longer words first
        .forEach(word => {
          if (word.length < 2 || this.STOP_WORDS.has(word)) return;
          const wordRegex = new RegExp(`(${this.escapeRegExp(word)})`, 'gi');
          highlighted = highlighted.replace(wordRegex, '**$1**');
        });

      return highlighted;
    } catch (error) {
      console.error('Error highlighting matches:', error);
      return text;
    }
  }

  private static escapeRegExp(string: string): string {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}