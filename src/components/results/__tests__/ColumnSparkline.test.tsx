import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { ColumnSparkline } from '@/components/results/ColumnSparkline';

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

describe('ColumnSparkline', () => {
  it('renders bar chart for numeric data', () => {
    renderWithProviders(
      <ColumnSparkline
        columnName="amount"
        columnType="integer"
        data={[1, 2, 3, 4, 5, 10, 15, 20]}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
  });

  it('renders pie chart for boolean data', () => {
    renderWithProviders(
      <ColumnSparkline
        columnName="active"
        columnType="boolean"
        data={[true, false, true, true, false]}
      />
    );

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('renders bar chart for text data', () => {
    renderWithProviders(
      <ColumnSparkline
        columnName="status"
        columnType="text"
        data={['active', 'inactive', 'active', 'pending', 'active']}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders text fallback for unknown type', () => {
    renderWithProviders(
      <ColumnSparkline
        columnName="blob_col"
        columnType="bytea"
        data={['abc', 'def', 'ghi', 'abc']}
      />
    );

    expect(screen.getByText('3 unique values')).toBeInTheDocument();
  });

  it('handles empty data array gracefully', () => {
    renderWithProviders(
      <ColumnSparkline
        columnName="amount"
        columnType="integer"
        data={[]}
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <ColumnSparkline
        columnName="blob_col"
        columnType="bytea"
        data={['a', 'b']}
        className="my-custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });
});
