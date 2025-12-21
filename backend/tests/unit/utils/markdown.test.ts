/**
 * Unit tests for Markdown/Rich Text utilities
 * Tests: sanitization, rendering, XSS prevention, formatting
 */

import { MarkdownService } from '../../../src/utils/MarkdownService';

describe('MarkdownService', () => {
  let markdownService: MarkdownService;

  beforeEach(() => {
    markdownService = new MarkdownService();
  });

  describe('Sanitization', () => {
    it('should sanitize HTML script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const sanitized = markdownService.sanitize(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello');
    });

    it('should sanitize javascript: protocol in links', () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const sanitized = markdownService.sanitize(malicious);

      expect(sanitized).not.toContain('javascript:');
    });

    it('should sanitize onclick handlers', () => {
      const malicious = '<div onclick="alert(1)">Click me</div>';
      const sanitized = markdownService.sanitize(malicious);

      expect(sanitized).not.toContain('onclick');
    });

    it('should allow safe HTML tags', () => {
      const safe = '<p><strong>Bold</strong> <em>italic</em> <code>code</code></p>';
      const sanitized = markdownService.sanitize(safe);

      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
      expect(sanitized).toContain('<code>');
    });

    it('should allow safe links', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const sanitized = markdownService.sanitize(safe);

      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).toContain('Link');
    });

    it('should sanitize iframes', () => {
      const malicious = '<iframe src="https://evil.com"></iframe>';
      const sanitized = markdownService.sanitize(malicious);

      expect(sanitized).not.toContain('<iframe');
    });

    it('should sanitize data URIs', () => {
      const malicious = '<img src="data:text/html,<script>alert(1)</script>">';
      const sanitized = markdownService.sanitize(malicious);

      expect(sanitized).not.toContain('data:text/html');
    });
  });

  describe('Markdown Rendering', () => {
    it('should render headers', () => {
      const markdown = '# Header 1\n## Header 2\n### Header 3';
      const html = markdownService.render(markdown);

      expect(html).toContain('<h1>');
      expect(html).toContain('<h2>');
      expect(html).toContain('<h3>');
      expect(html).toContain('Header 1');
    });

    it('should render bold text', () => {
      const markdown = '**bold text**';
      const html = markdownService.render(markdown);

      expect(html).toContain('<strong>bold text</strong>');
    });

    it('should render italic text', () => {
      const markdown = '*italic text*';
      const html = markdownService.render(markdown);

      expect(html).toContain('<em>italic text</em>');
    });

    it('should render inline code', () => {
      const markdown = '`const x = 1;`';
      const html = markdownService.render(markdown);

      expect(html).toContain('<code>const x = 1;</code>');
    });

    it('should render code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\nconsole.log(x);\n```';
      const html = markdownService.render(markdown);

      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('const x = 1;');
    });

    it('should render links', () => {
      const markdown = '[Example](https://example.com)';
      const html = markdownService.render(markdown);

      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('Example');
    });

    it('should render images', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      const html = markdownService.render(markdown);

      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/image.png"');
      expect(html).toContain('alt="Alt text"');
    });

    it('should render lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = markdownService.render(markdown);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
    });

    it('should render ordered lists', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const html = markdownService.render(markdown);

      expect(html).toContain('<ol>');
      expect(html).toContain('<li>First</li>');
    });

    it('should render blockquotes', () => {
      const markdown = '> This is a quote';
      const html = markdownService.render(markdown);

      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
    });

    it('should render horizontal rules', () => {
      const markdown = '---';
      const html = markdownService.render(markdown);

      expect(html).toContain('<hr');
    });
  });

  describe('Combined Rendering and Sanitization', () => {
    it('should render markdown and sanitize output', () => {
      const markdown = '**Bold** <script>alert("XSS")</script>';
      const html = markdownService.renderAndSanitize(markdown);

      expect(html).toContain('<strong>Bold</strong>');
      expect(html).not.toContain('<script>');
    });

    it('should handle mixed markdown and HTML safely', () => {
      const markdown = '# Header\n<div onclick="alert(1)">Click</div>\n**Bold**';
      const html = markdownService.renderAndSanitize(markdown);

      expect(html).toContain('<h1>Header</h1>');
      expect(html).not.toContain('onclick');
      expect(html).toContain('<strong>Bold</strong>');
    });
  });

  describe('Preview Generation', () => {
    it('should generate plain text preview from markdown', () => {
      const markdown = '# Header\n\nThis is **bold** text with a [link](https://example.com)';
      const preview = markdownService.getPlainTextPreview(markdown, 50);

      expect(preview).not.toContain('#');
      expect(preview).not.toContain('**');
      expect(preview).not.toContain('[');
      expect(preview).toContain('Header');
      expect(preview).toContain('bold');
    });

    it('should truncate preview to max length', () => {
      const markdown = 'This is a very long text that should be truncated when generating a preview';
      const preview = markdownService.getPlainTextPreview(markdown, 20);

      expect(preview.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(preview).toContain('...');
    });

    it('should not truncate if text is shorter than max length', () => {
      const markdown = 'Short text';
      const preview = markdownService.getPlainTextPreview(markdown, 50);

      expect(preview).toBe('Short text');
      expect(preview).not.toContain('...');
    });
  });

  describe('Markdown Detection', () => {
    it('should detect if text contains markdown', () => {
      expect(markdownService.hasMarkdown('# Header')).toBe(true);
      expect(markdownService.hasMarkdown('**bold**')).toBe(true);
      expect(markdownService.hasMarkdown('*italic*')).toBe(true);
      expect(markdownService.hasMarkdown('[link](url)')).toBe(true);
      expect(markdownService.hasMarkdown('`code`')).toBe(true);
      expect(markdownService.hasMarkdown('Plain text')).toBe(false);
    });

    it('should handle edge cases in markdown detection', () => {
      expect(markdownService.hasMarkdown('')).toBe(false);
      expect(markdownService.hasMarkdown('*')).toBe(false);
      expect(markdownService.hasMarkdown('**')).toBe(false);
      expect(markdownService.hasMarkdown('# ')).toBe(true);
    });
  });

  describe('Special Characters', () => {
    it('should escape HTML entities', () => {
      const markdown = '<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>';
      const sanitized = markdownService.sanitize(markdown);

      expect(sanitized).not.toContain('<script>');
    });

    it('should handle Unicode characters', () => {
      const markdown = '# 你好 世界 🌍';
      const html = markdownService.render(markdown);

      expect(html).toContain('你好 世界 🌍');
    });

    it('should handle special markdown characters', () => {
      const markdown = 'Price: $10\\*2 = \\$20';
      const html = markdownService.render(markdown);

      expect(html).toContain('$10*2');
      expect(html).toContain('$20');
    });
  });

  describe('Link Handling', () => {
    it('should add target="_blank" to external links', () => {
      const markdown = '[External](https://example.com)';
      const html = markdownService.renderWithSafeLinks(markdown);

      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('should auto-link URLs', () => {
      const markdown = 'Visit https://example.com for more info';
      const html = markdownService.renderWithAutoLinks(markdown);

      expect(html).toContain('<a href="https://example.com"');
    });

    it('should handle email addresses', () => {
      const markdown = 'Contact: user@example.com';
      const html = markdownService.renderWithAutoLinks(markdown);

      expect(html).toContain('mailto:user@example.com');
    });
  });

  describe('Table Support', () => {
    it('should render markdown tables', () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
      `;
      const html = markdownService.render(markdown);

      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('Header 1');
      expect(html).toContain('Cell 1');
    });
  });

  describe('Task Lists', () => {
    it('should render task lists', () => {
      const markdown = '- [ ] Unchecked\n- [x] Checked';
      const html = markdownService.render(markdown);

      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
    });
  });

  describe('Error Handling', () => {
    it('should handle null input', () => {
      const html = markdownService.render(null as any);
      expect(html).toBe('');
    });

    it('should handle undefined input', () => {
      const html = markdownService.render(undefined as any);
      expect(html).toBe('');
    });

    it('should handle malformed markdown', () => {
      const markdown = '# Header\n[broken link](';
      expect(() => {
        markdownService.render(markdown);
      }).not.toThrow();
    });

    it('should handle deeply nested structures', () => {
      let markdown = '';
      for (let i = 0; i < 100; i++) {
        markdown += '> ';
      }
      markdown += 'Deep quote';

      expect(() => {
        markdownService.render(markdown);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', () => {
      const largeMarkdown = '# Header\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(1000);

      const startTime = Date.now();
      markdownService.renderAndSanitize(largeMarkdown);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should process in less than 1 second
    });

    it('should cache rendered output', () => {
      const markdown = '# Header\n\nSome content';

      const firstRender = markdownService.renderWithCache(markdown);
      const secondRender = markdownService.renderWithCache(markdown);

      expect(firstRender).toBe(secondRender);
      // Second render should be from cache (implementation dependent)
    });
  });
});
