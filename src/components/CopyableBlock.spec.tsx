import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CopyableBlock from './CopyableBlock';

const mockWriteText = jest.fn()

Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CopyableBlock', () => {
    beforeAll(() => {
        // @ts-expect-error: typing
        navigator.clipboard.writeText.mockResolvedValue(undefined)
    });

    it('renders without crashing', () => {
        render(<CopyableBlock />);
    });

    it('displays markdown content', () => {
        const markdown = '# Test Markdown';
        render(<CopyableBlock markdown={markdown} />);
        expect(screen.getByText(markdown)).toBeInTheDocument();
    });

    it('copies markdown to clipboard on button click', async () => {
        const markdown = '# Test Markdown';
        render(<CopyableBlock markdown={markdown} />);
        const copyButton = screen.getByRole('button', { name: /copy code/i }); // Use regex for partial match

        fireEvent.click(copyButton);

        expect(mockWriteText).toHaveBeenCalledWith(markdown);
        
        // Check for "Copied" message
        await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeVisible());

        // Check if the "Copy code" message is hidden after 2 seconds
        await waitFor(() => expect(screen.getByRole('button', { name: /copy code/i })).toBeVisible(), {timeout: 3000}); // Increased timeout to 3s because of 2s timer
    });

    it('handles empty markdown', async () => {
        render(<CopyableBlock />);
        const copyButton = screen.getByRole('button', { name: /copy code/i });

        fireEvent.click(copyButton);

        expect(mockWriteText).toHaveBeenCalledWith(''); // Should copy an empty string
    });

    it('displays "Copied" message after click and then reverts', async () => {
        const markdown = '# Test Markdown';
        render(<CopyableBlock markdown={markdown} />);
        const copyButton = screen.getByRole('button', { name: /copy code/i });

        fireEvent.click(copyButton);

        await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeVisible());
        await waitFor(() => expect(screen.getByRole('button', { name: /copy code/i })).toBeVisible(), {timeout: 3000}); // Increased timeout to 3s because of 2s timer
    });
});