import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { ResultsSummary } from '@/components/results/ResultsSummary';
import type { QueryResults } from '@/types';

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

function makeResults(overrides?: Partial<QueryResults>): QueryResults {
  return {
    columns: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'active', type: 'boolean' },
    ],
    rows: [
      { id: 1, name: 'Alice', created_at: '2025-01-01', active: true },
      { id: 2, name: null, created_at: '2025-02-01', active: false },
      { id: 3, name: 'Charlie', created_at: null, active: true },
    ],
    total: 100,
    page: 1,
    page_size: 25,
    total_pages: 4,
    ...overrides,
  };
}

describe('ResultsSummary', () => {
  it('renders collapsed by default', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    expect(screen.getByText('Results Summary')).toBeInTheDocument();
    expect(screen.queryByTestId('summary-content')).not.toBeInTheDocument();
  });

  it('expands on toggle button click', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('summary-content')).toBeInTheDocument();
  });

  it('shows total row count', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('total-rows')).toHaveTextContent('100');
  });

  it('shows column count with type breakdown', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByText('4')).toBeInTheDocument();
    const breakdown = screen.getByTestId('type-breakdown');
    expect(breakdown.textContent).toContain('1 numeric');
    expect(breakdown.textContent).toContain('1 text');
    expect(breakdown.textContent).toContain('1 datetime');
    expect(breakdown.textContent).toContain('1 boolean');
  });

  it('shows null percentage for columns', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    const heatmap = screen.getByTestId('null-heatmap');
    expect(heatmap).toBeInTheDocument();
    // "name" has 1 null out of 3 rows = 33%
    expect(heatmap.textContent).toContain('33%');
  });

  it('shows type composition chart', () => {
    renderWithProviders(<ResultsSummary results={makeResults()} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('type-composition-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles empty results', () => {
    const empty: QueryResults = {
      columns: [],
      rows: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 0,
    };

    renderWithProviders(<ResultsSummary results={empty} />);

    fireEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('total-rows')).toHaveTextContent('0');
    expect(screen.getByText('No columns')).toBeInTheDocument();
  });
});
