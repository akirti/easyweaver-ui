import { renderWithProviders, screen } from '@/test/test-utils';
import { TypeBadge } from '@/components/query/TypeBadge';

describe('TypeBadge', () => {
  it('renders correct label for numeric types', () => {
    renderWithProviders(<TypeBadge type="integer" />);
    expect(screen.getByText('INT')).toBeInTheDocument();
  });

  it('renders correct label for text types', () => {
    renderWithProviders(<TypeBadge type="character varying" />);
    expect(screen.getByText('VARCHAR')).toBeInTheDocument();
  });

  it('renders correct label for datetime types', () => {
    renderWithProviders(<TypeBadge type="timestamp with time zone" />);
    expect(screen.getByText('TIMESTAMP')).toBeInTheDocument();
  });

  it('renders correct label for boolean types', () => {
    renderWithProviders(<TypeBadge type="boolean" />);
    expect(screen.getByText('BOOL')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    renderWithProviders(<TypeBadge type="integer" />);
    expect(screen.getByLabelText('Type: integer')).toBeInTheDocument();
  });

  it('applies correct color classes for numeric type', () => {
    renderWithProviders(<TypeBadge type="integer" />);
    const badge = screen.getByText('INT');
    expect(badge.className).toMatch(/indigo/);
  });

  it('applies correct color classes for text type', () => {
    renderWithProviders(<TypeBadge type="text" />);
    const badge = screen.getByText('TEXT');
    expect(badge.className).toMatch(/green/);
  });

  it('applies correct color classes for datetime type', () => {
    renderWithProviders(<TypeBadge type="date" />);
    const badge = screen.getByText('DATE');
    expect(badge.className).toMatch(/amber/);
  });

  it('applies correct color classes for boolean type', () => {
    renderWithProviders(<TypeBadge type="boolean" />);
    const badge = screen.getByText('BOOL');
    expect(badge.className).toMatch(/purple/);
  });

  it('applies correct color classes for other type', () => {
    renderWithProviders(<TypeBadge type="jsonb" />);
    const badge = screen.getByText('JSONB');
    expect(badge.className).toMatch(/gray/);
  });
});
