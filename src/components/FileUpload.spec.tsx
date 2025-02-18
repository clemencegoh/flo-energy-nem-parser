import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUploadComponent from './FileUpload';
import { useS3Upload } from 'next-s3-upload';

jest.mock('next-s3-upload', () => ({
  useS3Upload: jest.fn(),
}));

describe('FileUploadComponent', () => {
  const mockUploadToS3 = jest.fn();
  const mockOpenFileDialog = jest.fn();
  // @ts-expect-error: onChange required
  const MockFileInput = ({ onChange }) => <input type="file" onChange={onChange} data-testid="file-input" />;

  beforeEach(() => {
    (useS3Upload as jest.Mock).mockReturnValue({
      FileInput: MockFileInput,
      openFileDialog: mockOpenFileDialog,
      uploadToS3: mockUploadToS3,
    });
    mockUploadToS3.mockResolvedValue({ url: 'mockUrl', key: 'mockKey' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FileUploadComponent />);
  });

  it('opens file dialog on button click', () => {
    render(<FileUploadComponent />);
    const uploadButton = screen.getByText('UPLOAD CSV');
    fireEvent.click(uploadButton);
    expect(mockOpenFileDialog).toHaveBeenCalledTimes(1);
  });

  it('uploads file and calls onUploaded callback', async () => {
    const onUploaded = jest.fn();
    render(<FileUploadComponent onUploaded={onUploaded} />);
    const fileInput = screen.getByTestId('file-input');
    const mockFile = new File(['file content'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => expect(mockUploadToS3).toHaveBeenCalled());
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith('mockUrl', 'mockKey'));
    await waitFor(() => expect(screen.getByTestId('checkmark')).toBeInTheDocument());
    expect(screen.getByTestId('checkmark')).toHaveClass('mb-2');
  });

  it('displays loading icon during upload', async () => {
    mockUploadToS3.mockImplementation(() => new Promise(() => {})); // Simulate ongoing upload
    render(<FileUploadComponent />);
    const fileInput = screen.getByTestId('file-input');
    const mockFile = new File(['file content'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('hides loading icon after upload', async () => {
    render(<FileUploadComponent />);
    const fileInput = screen.getByTestId('file-input');
    const mockFile = new File(['file content'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => expect(mockUploadToS3).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
  });

  it('does not call onUploaded if not provided', async () => {
    render(<FileUploadComponent />);
    const fileInput = screen.getByTestId('file-input');
    const mockFile = new File(['file content'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => expect(mockUploadToS3).toHaveBeenCalled());
  });
});