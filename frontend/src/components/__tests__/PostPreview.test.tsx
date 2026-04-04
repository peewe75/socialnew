import { render, screen, fireEvent } from '@testing-library/react';
import PostPreview from '../PostPreview';

describe('PostPreview Component', () => {
  const mockPost = {
    platform: 'linkedin',
    content: 'Test post content',
    hashtags: ['#test', '#demo'],
  };

  const mockOnEdit = jest.fn();

  it('should render post content', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    expect(screen.getByText('Test post content')).toBeInTheDocument();
  });

  it('should display platform icon', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    expect(screen.getByText('💼')).toBeInTheDocument(); // LinkedIn icon
  });

  it('should display hashtags', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    expect(screen.getByText('#test')).toBeInTheDocument();
    expect(screen.getByText('#demo')).toBeInTheDocument();
  });

  it('should enter edit mode on edit button click', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    const editButton = screen.getByText('✏️ Edit');
    fireEvent.click(editButton);
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
  });

  it('should call onEdit when content is updated', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByText('✏️ Edit');
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test post content');
    fireEvent.change(textarea, { target: { value: 'Updated content' } });
    fireEvent.blur(textarea);
    
    expect(mockOnEdit).toHaveBeenCalledWith('Updated content');
  });

  it('should show character count', () => {
    render(<PostPreview post={mockPost} onEdit={mockOnEdit} />);
    expect(screen.getByText(/Length: \d+ chars/)).toBeInTheDocument();
  });

  it('should handle different platforms', () => {
    const platforms = ['linkedin', 'facebook', 'instagram', 'tiktok'];
    
    platforms.forEach(platform => {
      const { unmount } = render(
        <PostPreview 
          post={{ ...mockPost, platform: platform as any }} 
          onEdit={mockOnEdit} 
        />
      );
      
      expect(screen.getByText(new RegExp(platform, 'i'))).toBeInTheDocument();
      unmount();
    });
  });
});