import { render, screen } from '@testing-library/react';
import BlogCard from '../../components/BlogCard';

const mockBlog = {
  id: '1',
  title: 'Test Blog Post',
  content: '<p>This is test content for the blog post</p>',
  thumbnail: 'https://example.com/image.jpg',
  category: 'Technology',
  authorName: 'Test Author',
  createdAt: new Date('2026-02-01').toISOString(),
  views: 100,
};

describe('BlogCard Component', () => {
  it('renders blog title', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('renders author name when provided', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders without thumbnail gracefully', () => {
    const blogWithoutImage = { ...mockBlog, thumbnail: null };
    render(<BlogCard blog={blogWithoutImage} />);
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
  });

  it('has correct link to blog page', () => {
    render(<BlogCard blog={mockBlog} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog?id=1');
  });
});
