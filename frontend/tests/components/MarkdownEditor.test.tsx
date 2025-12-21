/**
 * Frontend tests for Markdown Editor component
 * Tests: rendering, editing, preview, formatting
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../helpers/render';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import userEvent from '@testing-library/user-event';

describe('MarkdownEditor Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Enter text...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render editor with placeholder', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<MarkdownEditor {...defaultProps} value="# Hello World" />);

      expect(screen.getByDisplayValue('# Hello World')).toBeInTheDocument();
    });

    it('should render toolbar', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Link')).toBeInTheDocument();
    });

    it('should render preview toggle', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('should call onChange when typing', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');

      expect(onChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenLastCalledWith('Hello');
    });

    it('should handle multiline input', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Line 1{Enter}Line 2');

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('Line 1\nLine 2'));
    });

    it('should preserve cursor position during edits', async () => {
      render(<MarkdownEditor {...defaultProps} value="Hello World" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Set cursor position
      textarea.setSelectionRange(5, 5);
      await userEvent.type(textarea, ' Beautiful');

      expect(textarea.value).toContain('Hello Beautiful World');
    });
  });

  describe('Toolbar Actions', () => {
    it('should insert bold markdown', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const boldButton = screen.getByLabelText('Bold');
      await userEvent.click(boldButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('****'));
    });

    it('should wrap selected text with bold', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} value="Hello World" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      textarea.setSelectionRange(0, 5); // Select "Hello"

      const boldButton = screen.getByLabelText('Bold');
      await userEvent.click(boldButton);

      expect(onChange).toHaveBeenCalledWith('**Hello** World');
    });

    it('should insert italic markdown', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const italicButton = screen.getByLabelText('Italic');
      await userEvent.click(italicButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**'));
    });

    it('should insert link markdown', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const linkButton = screen.getByLabelText('Link');
      await userEvent.click(linkButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('[]('));
    });

    it('should insert header markdown', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const headerButton = screen.getByLabelText('Header');
      await userEvent.click(headerButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('# '));
    });

    it('should insert code block', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const codeButton = screen.getByLabelText('Code');
      await userEvent.click(codeButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('```'));
    });

    it('should insert list', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const listButton = screen.getByLabelText('List');
      await userEvent.click(listButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('- '));
    });
  });

  describe('Preview Mode', () => {
    it('should toggle preview mode', async () => {
      render(<MarkdownEditor {...defaultProps} value="# Hello" />);

      const previewButton = screen.getByText('Preview');
      await userEvent.click(previewButton);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should render markdown in preview', async () => {
      render(<MarkdownEditor {...defaultProps} value="# Hello\n**Bold**" />);

      const previewButton = screen.getByText('Preview');
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
        expect(screen.getByText('Bold')).toHaveStyle('font-weight: bold');
      });
    });

    it('should switch back to edit mode', async () => {
      render(<MarkdownEditor {...defaultProps} value="# Hello" />);

      const previewButton = screen.getByText('Preview');
      await userEvent.click(previewButton);

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should sanitize HTML in preview', async () => {
      render(
        <MarkdownEditor
          {...defaultProps}
          value='<script>alert("XSS")</script>Safe text'
        />
      );

      const previewButton = screen.getByText('Preview');
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.queryByText('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Safe text')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should apply bold with Ctrl+B', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} value="Hello" onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '{Control>}b{/Control}');

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**'));
    });

    it('should apply italic with Ctrl+I', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} value="Hello" onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '{Control>}i{/Control}');

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('*'));
    });

    it('should insert link with Ctrl+K', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '{Control>}k{/Control}');

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('[]('));
    });

    it('should handle Tab for indentation', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '{Tab}');

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('  '));
    });
  });

  describe('Character Counter', () => {
    it('should display character count', () => {
      render(<MarkdownEditor {...defaultProps} value="Hello" showCharCount />);

      expect(screen.getByText(/5 characters/i)).toBeInTheDocument();
    });

    it('should update character count on input', async () => {
      render(<MarkdownEditor {...defaultProps} value="" showCharCount />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello World');

      expect(screen.getByText(/11 characters/i)).toBeInTheDocument();
    });

    it('should show warning near max length', () => {
      render(
        <MarkdownEditor
          {...defaultProps}
          value="a".repeat(490)
          maxLength={500}
          showCharCount
        />
      );

      const counter = screen.getByText(/490/);
      expect(counter).toHaveClass('text-warning');
    });

    it('should prevent input beyond max length', async () => {
      const onChange = jest.fn();
      render(
        <MarkdownEditor
          {...defaultProps}
          value="a".repeat(500)
          maxLength={500}
          onChange={onChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'b');

      // Should not call onChange for character beyond max
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Auto-save', () => {
    it('should auto-save after delay', async () => {
      jest.useFakeTimers();
      const onAutoSave = jest.fn();

      render(
        <MarkdownEditor
          {...defaultProps}
          autoSave
          autoSaveDelay={1000}
          onAutoSave={onAutoSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledWith('Hello');
      });

      jest.useRealTimers();
    });

    it('should reset auto-save timer on new input', async () => {
      jest.useFakeTimers();
      const onAutoSave = jest.fn();

      render(
        <MarkdownEditor
          {...defaultProps}
          autoSave
          autoSaveDelay={1000}
          onAutoSave={onAutoSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');

      jest.advanceTimersByTime(500);

      await userEvent.type(textarea, ' World');

      jest.advanceTimersByTime(500);

      // Should not have saved yet
      expect(onAutoSave).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledWith('Hello World');
      });

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByRole('textbox')).toHaveAccessibleName();
      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<MarkdownEditor {...defaultProps} />);

      await userEvent.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByLabelText('Bold')).toHaveFocus();
    });

    it('should announce changes to screen readers', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      render(<MarkdownEditor {...defaultProps} error="Invalid input" />);

      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('should apply error styling', () => {
      render(<MarkdownEditor {...defaultProps} error="Invalid input" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('error');
    });

    it('should clear error on valid input', async () => {
      const { rerender } = render(
        <MarkdownEditor {...defaultProps} error="Invalid input" />
      );

      expect(screen.getByText('Invalid input')).toBeInTheDocument();

      rerender(<MarkdownEditor {...defaultProps} error="" />);

      expect(screen.queryByText('Invalid input')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      render(<MarkdownEditor {...defaultProps} disabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should disable toolbar buttons when disabled', () => {
      render(<MarkdownEditor {...defaultProps} disabled />);

      expect(screen.getByLabelText('Bold')).toBeDisabled();
      expect(screen.getByLabelText('Italic')).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor {...defaultProps} onChange={onChange} disabled />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello');

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
