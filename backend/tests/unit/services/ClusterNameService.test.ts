/**
 * Unit tests for Cluster Name Generation Service
 * Tests: AI integration, fallback handling, theme extraction
 */

import { ClusterNameService } from '../../../src/services/ClusterNameService';
import { CardModel } from '../../../src/models/Card';

describe('ClusterNameService', () => {
  let service: ClusterNameService;

  beforeEach(() => {
    service = new ClusterNameService();
  });

  describe('Theme Extraction', () => {
    it('should extract common theme from similar cards', async () => {
      const cards = [
        { content: 'Tests are running slowly' },
        { content: 'Test suite takes too long' },
        { content: 'Need faster test execution' },
      ];

      const theme = await service.extractTheme(cards);

      expect(theme).toContain('test');
      expect(theme.toLowerCase()).toMatch(/slow|performance|speed/);
    });

    it('should extract theme from technical cards', async () => {
      const cards = [
        { content: 'API returning 500 errors' },
        { content: 'Backend service crashes' },
        { content: 'Server timeout issues' },
      ];

      const theme = await service.extractTheme(cards);

      expect(theme.toLowerCase()).toMatch(/api|backend|server|service/);
    });

    it('should extract theme from process cards', async () => {
      const cards = [
        { content: 'Daily standup too long' },
        { content: 'Sprint planning inefficient' },
        { content: 'Retro meetings could be better' },
      ];

      const theme = await service.extractTheme(cards);

      expect(theme.toLowerCase()).toMatch(/meeting|process|ceremony/);
    });

    it('should handle cards with minimal overlap', async () => {
      const cards = [
        { content: 'Documentation needs update' },
        { content: 'Code review process' },
        { content: 'Coffee machine broken' },
      ];

      const theme = await service.extractTheme(cards);

      // Should generate a generic but meaningful theme
      expect(theme).toBeTruthy();
      expect(theme.length).toBeGreaterThan(0);
    });
  });

  describe('AI-Powered Generation', () => {
    it('should call AI service with card contents', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('Test Performance');

      const cards = [
        { content: 'Tests are slow' },
        { content: 'Test suite timeout' },
      ];

      const name = await service.generateWithAI(cards);

      expect(mockAIService).toHaveBeenCalledWith(
        expect.stringContaining('Tests are slow')
      );
      expect(name).toBe('Test Performance');

      mockAIService.mockRestore();
    });

    it('should limit card content sent to AI', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('Theme Name');

      const cards = Array(20)
        .fill(null)
        .map((_, i) => ({ content: `Card ${i}` }));

      await service.generateWithAI(cards);

      const callArg = mockAIService.mock.calls[0][0];

      // Should limit to prevent token overflow
      const cardCount = (callArg.match(/Card \d+/g) || []).length;
      expect(cardCount).toBeLessThanOrEqual(10);

      mockAIService.mockRestore();
    });

    it('should handle AI service timeout', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(''), 10000))
      );

      const cards = [{ content: 'Test card' }];

      const result = await service.generateWithAI(cards, { timeout: 100 });

      expect(result).toBeNull();

      mockAIService.mockRestore();
    });

    it('should handle AI service errors gracefully', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockRejectedValue(new Error('AI service unavailable'));

      const cards = [{ content: 'Test card' }];

      const result = await service.generateWithAI(cards);

      expect(result).toBeNull();

      mockAIService.mockRestore();
    });

    it('should sanitize AI-generated names', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('<script>alert("XSS")</script>Safe Name');

      const cards = [{ content: 'Test' }];

      const name = await service.generateWithAI(cards);

      expect(name).not.toContain('<script>');
      expect(name).toContain('Safe Name');

      mockAIService.mockRestore();
    });

    it('should truncate overly long AI responses', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('A'.repeat(200));

      const cards = [{ content: 'Test' }];

      const name = await service.generateWithAI(cards);

      expect(name.length).toBeLessThanOrEqual(50);

      mockAIService.mockRestore();
    });
  });

  describe('Fallback Generation', () => {
    it('should generate fallback name from keywords', () => {
      const cards = [
        { content: 'Testing performance issues' },
        { content: 'Performance of test suite' },
        { content: 'Test execution speed' },
      ];

      const name = service.generateFallback(cards);

      expect(name.toLowerCase()).toMatch(/test|performance/);
    });

    it('should use most common words for fallback', () => {
      const cards = [
        { content: 'bug in authentication' },
        { content: 'authentication failing' },
        { content: 'login authentication issue' },
      ];

      const name = service.generateFallback(cards);

      expect(name.toLowerCase()).toContain('authentication');
    });

    it('should filter out common stop words', () => {
      const cards = [
        { content: 'The test is not working' },
        { content: 'The system is broken' },
        { content: 'The bug is critical' },
      ];

      const name = service.generateFallback(cards);

      expect(name.toLowerCase()).not.toMatch(/^the /);
      expect(name.toLowerCase()).not.toMatch(/^is /);
    });

    it('should capitalize fallback names properly', () => {
      const cards = [
        { content: 'api integration' },
        { content: 'api endpoints' },
      ];

      const name = service.generateFallback(cards);

      expect(name[0]).toBe(name[0].toUpperCase());
    });

    it('should handle empty card contents', () => {
      const cards = [
        { content: '' },
        { content: '' },
      ];

      const name = service.generateFallback(cards);

      expect(name).toBe('Untitled Cluster');
    });

    it('should handle single word contents', () => {
      const cards = [
        { content: 'bug' },
        { content: 'bug' },
        { content: 'bug' },
      ];

      const name = service.generateFallback(cards);

      expect(name.toLowerCase()).toContain('bug');
    });

    it('should combine multiple keywords', () => {
      const cards = [
        { content: 'documentation update needed' },
        { content: 'update documentation' },
      ];

      const name = service.generateFallback(cards);

      expect(name.toLowerCase()).toMatch(/documentation.*update|update.*documentation/);
    });
  });

  describe('Name Generation Strategy', () => {
    it('should try AI first, then fallback', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('AI Generated Name');

      const fallbackSpy = jest.spyOn(service, 'generateFallback');

      const cards = [{ content: 'Test' }];

      const name = await service.generateName(cards);

      expect(mockAIService).toHaveBeenCalled();
      expect(fallbackSpy).not.toHaveBeenCalled();
      expect(name).toBe('AI Generated Name');

      mockAIService.mockRestore();
      fallbackSpy.mockRestore();
    });

    it('should use fallback when AI fails', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockRejectedValue(new Error('AI Error'));

      const fallbackSpy = jest.spyOn(service, 'generateFallback');
      fallbackSpy.mockReturnValue('Fallback Name');

      const cards = [{ content: 'Test' }];

      const name = await service.generateName(cards);

      expect(fallbackSpy).toHaveBeenCalled();
      expect(name).toBe('Fallback Name');

      mockAIService.mockRestore();
      fallbackSpy.mockRestore();
    });

    it('should use fallback when AI disabled', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      const fallbackSpy = jest.spyOn(service, 'generateFallback');
      fallbackSpy.mockReturnValue('Fallback Name');

      const cards = [{ content: 'Test' }];

      const name = await service.generateName(cards, { useAI: false });

      expect(mockAIService).not.toHaveBeenCalled();
      expect(fallbackSpy).toHaveBeenCalled();

      mockAIService.mockRestore();
      fallbackSpy.mockRestore();
    });
  });

  describe('Name Validation', () => {
    it('should validate name length', () => {
      expect(service.isValidName('Valid Name')).toBe(true);
      expect(service.isValidName('')).toBe(false);
      expect(service.isValidName('A'.repeat(100))).toBe(false);
    });

    it('should reject names with only special characters', () => {
      expect(service.isValidName('!!!')).toBe(false);
      expect(service.isValidName('###')).toBe(false);
    });

    it('should accept names with alphanumeric characters', () => {
      expect(service.isValidName('Bug Fix 123')).toBe(true);
      expect(service.isValidName('API v2 Issues')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(service.isValidName('  Valid Name  ')).toBe(true);
      expect(service.isValidName('   ')).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache generated names', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('Cached Name');

      const cards = [
        { id: '1', content: 'Test A' },
        { id: '2', content: 'Test B' },
      ];

      const name1 = await service.generateName(cards);
      const name2 = await service.generateName(cards);

      expect(mockAIService).toHaveBeenCalledTimes(1);
      expect(name1).toBe(name2);

      mockAIService.mockRestore();
    });

    it('should invalidate cache when cards change', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService
        .mockResolvedValueOnce('Name 1')
        .mockResolvedValueOnce('Name 2');

      const cards1 = [{ id: '1', content: 'Test A' }];
      const cards2 = [{ id: '1', content: 'Test B' }];

      const name1 = await service.generateName(cards1);
      const name2 = await service.generateName(cards2);

      expect(mockAIService).toHaveBeenCalledTimes(2);
      expect(name1).not.toBe(name2);

      mockAIService.mockRestore();
    });

    it('should clear cache', async () => {
      const mockAIService = jest.spyOn(service['aiService'], 'generateText');
      mockAIService.mockResolvedValue('Name');

      const cards = [{ content: 'Test' }];

      await service.generateName(cards);
      service.clearCache();
      await service.generateName(cards);

      expect(mockAIService).toHaveBeenCalledTimes(2);

      mockAIService.mockRestore();
    });
  });

  describe('Language Support', () => {
    it('should handle non-English content', async () => {
      const cards = [
        { content: 'Pruebas son lentas' },
        { content: 'Problemas de rendimiento' },
      ];

      const name = await service.generateName(cards);

      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });

    it('should handle mixed language content', async () => {
      const cards = [
        { content: 'Test performance' },
        { content: 'Rendimiento de pruebas' },
      ];

      const name = await service.generateName(cards);

      expect(name).toBeTruthy();
    });

    it('should handle Unicode characters', async () => {
      const cards = [
        { content: '测试性能问题' },
        { content: '系统响应慢' },
      ];

      const name = await service.generateName(cards);

      expect(name).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should generate names quickly for small clusters', async () => {
      const cards = [
        { content: 'Card 1' },
        { content: 'Card 2' },
        { content: 'Card 3' },
      ];

      const startTime = Date.now();
      await service.generateName(cards, { useAI: false });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle large clusters efficiently', async () => {
      const cards = Array(50)
        .fill(null)
        .map((_, i) => ({ content: `Card ${i}` }));

      const startTime = Date.now();
      await service.generateName(cards, { useAI: false });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null card content', () => {
      const cards = [
        { content: null },
        { content: undefined },
        { content: 'Valid' },
      ];

      const name = service.generateFallback(cards);

      expect(name).toBeTruthy();
    });

    it('should handle special characters in content', () => {
      const cards = [
        { content: '@@@ Bug in @mentions' },
        { content: '#hashtag problems' },
      ];

      const name = service.generateFallback(cards);

      expect(name).toBeTruthy();
      expect(name).not.toContain('@@@');
    });

    it('should handle very long card content', () => {
      const cards = [
        { content: 'Test '.repeat(1000) },
      ];

      const name = service.generateFallback(cards);

      expect(name.length).toBeLessThan(100);
    });

    it('should handle empty array', () => {
      const name = service.generateFallback([]);

      expect(name).toBe('Untitled Cluster');
    });
  });
});
