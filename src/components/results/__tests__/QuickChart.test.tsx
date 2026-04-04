import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { QuickChart } from '@/components/results/QuickChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => null,
  Legend: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}));

describe('QuickChart', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    columnName: 'amount',
    columnType: 'integer',
    data: [1, 2, 3, 4, 5, 10, 15, 20],
  };

  it('renders dialog when open', () => {
    renderWithProviders(<QuickChart {...defaultProps} />);

    expect(screen.getByText('Distribution of amount')).toBeInTheDocument();
    expect(screen.getByTestId('quick-chart-content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<QuickChart {...defaultProps} open={false} />);

    expect(screen.queryByText('Distribution of amount')).not.toBeInTheDocument();
  });

  it('shows correct title with column name', () => {
    renderWithProviders(
      <QuickChart {...defaultProps} columnName="salary" />
    );

    expect(screen.getByText('Distribution of salary')).toBeInTheDocument();
  });

  it('renders bar chart for numeric column', () => {
    renderWithProviders(<QuickChart {...defaultProps} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders pie chart for boolean column', () => {
    renderWithProviders(
      <QuickChart
        {...defaultProps}
        columnType="boolean"
        data={[true, false, true, true, false]}
      />
    );

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders bar chart for text column', () => {
    renderWithProviders(
      <QuickChart
        {...defaultProps}
        columnType="text"
        data={['a', 'b', 'c', 'a', 'b', 'a']}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('calls onOpenChange when closed', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <QuickChart {...defaultProps} onOpenChange={onOpenChange} />
    );

    // The dialog close button should trigger onOpenChange
    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
