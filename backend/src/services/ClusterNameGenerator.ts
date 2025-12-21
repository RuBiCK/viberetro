import { Card } from '../../../shared/types';

/**
 * Simple keyword extraction and cluster name generation service
 * Uses basic text analysis without requiring AI/ML libraries
 */
export class ClusterNameGenerator {
  // Common English stop words to filter out
  private static readonly STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'we', 'our', 'us', 'they',
    'their', 'them', 'this', 'these', 'those', 'have', 'had', 'do',
    'does', 'did', 'can', 'could', 'would', 'should', 'may', 'might',
    'must', 'but', 'or', 'so', 'if', 'then', 'than', 'when', 'where',
    'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'not', 'no',
    'nor', 'too', 'very', 'just', 'also', 'been', 'being', 'both'
  ]);

  // Action/topic words that are good cluster names
  private static readonly PRIORITY_WORDS = new Set([
    'bug', 'bugs', 'issue', 'issues', 'problem', 'problems', 'error', 'errors',
    'test', 'tests', 'testing', 'documentation', 'docs', 'documentation',
    'performance', 'speed', 'slow', 'fast', 'code', 'deploy', 'deployment',
    'communication', 'meeting', 'meetings', 'team', 'process', 'workflow',
    'feature', 'features', 'improvement', 'improvements', 'refactor', 'refactoring',
    'design', 'ui', 'ux', 'user', 'users', 'customer', 'customers',
    'api', 'backend', 'frontend', 'database', 'infrastructure', 'security',
    'quality', 'technical', 'debt', 'blocker', 'blockers', 'integration'
  ]);

  /**
   * Generate a cluster name from multiple cards
   */
  static generateName(cards: Card[]): string {
    if (cards.length === 0) {
      return 'Untitled Cluster';
    }

    if (cards.length === 1) {
      return this.truncateText(cards[0].content, 30);
    }

    // Extract keywords from all cards
    const keywords = this.extractKeywords(cards);

    if (keywords.length === 0) {
      return 'Untitled Cluster';
    }

    // Take top 2-3 keywords and form a name
    const topKeywords = keywords.slice(0, Math.min(3, keywords.length));
    let name = topKeywords.map(k => this.capitalizeFirst(k)).join(' & ');

    // Add "Issues" or "Topics" suffix if appropriate
    if (topKeywords.length === 1) {
      const word = topKeywords[0].toLowerCase();
      if (!word.endsWith('s') && !word.endsWith('ing')) {
        name = this.addSuffix(name, cards);
      }
    }

    return this.truncateText(name, 50);
  }

  /**
   * Extract and rank keywords from cards
   */
  private static extractKeywords(cards: Card[]): string[] {
    const wordFrequency = new Map<string, number>();
    const wordPriority = new Map<string, number>();

    // Process each card's content
    for (const card of cards) {
      const words = this.tokenize(card.content);

      for (const word of words) {
        const lower = word.toLowerCase();

        // Skip stop words and very short words
        if (this.STOP_WORDS.has(lower) || word.length < 3) {
          continue;
        }

        // Count frequency
        wordFrequency.set(lower, (wordFrequency.get(lower) || 0) + 1);

        // Add priority score for important words
        if (this.PRIORITY_WORDS.has(lower)) {
          wordPriority.set(lower, (wordPriority.get(lower) || 0) + 3);
        }
      }
    }

    // Calculate scores: frequency + priority
    const wordScores = new Map<string, number>();
    for (const [word, freq] of wordFrequency.entries()) {
      const priority = wordPriority.get(word) || 0;
      wordScores.set(word, freq + priority);
    }

    // Sort by score and return top words
    return Array.from(wordScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  /**
   * Tokenize text into words
   */
  private static tokenize(text: string): string[] {
    // Remove markdown syntax
    const cleaned = text
      .replace(/[*_`#\[\]()]/g, ' ') // Remove markdown chars
      .replace(/https?:\/\/[^\s]+/g, ' ') // Remove URLs
      .replace(/[^\w\s'-]/g, ' '); // Keep only words, hyphens, apostrophes

    return cleaned
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Add appropriate suffix to cluster name
   */
  private static addSuffix(name: string, cards: Card[]): string {
    const allText = cards.map(c => c.content.toLowerCase()).join(' ');

    // Check for common patterns
    if (allText.includes('issue') || allText.includes('problem') || allText.includes('bug')) {
      return `${name} Issues`;
    }
    if (allText.includes('improve') || allText.includes('better') || allText.includes('enhance')) {
      return `${name} Improvements`;
    }
    if (allText.includes('test') || allText.includes('testing')) {
      return `${name} Testing`;
    }

    return `${name} Topics`;
  }

  /**
   * Capitalize first letter
   */
  private static capitalizeFirst(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Truncate text to max length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
