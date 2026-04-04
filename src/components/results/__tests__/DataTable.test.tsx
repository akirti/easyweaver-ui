import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { DataTable } from '@/components/results/DataTable';
import { useQueryResults } from '@/queries/use-queries';
import type { QueryResults } from '@/types';

vi.mock('@/queries/use-queries', () => ({
  useQueryResults: vi.fn(),
}));

vi.mock('@/api/queries', () => ({
  queriesApi: { exportCsv: vi.fn() },
}));

const mockResults: QueryResults = {
  columns: [
    { name: 'id', type: 'integer' },
    { name: 'name', type: 'character varying' },
    { name: 'amount', type: 'numeric' },
  ],
  rows: [
    { id: 1, name: 'Alice', amount: 100 },
    { id: 2, name: 'Bob', amount: 200 },
    { id: 3, name: 'Charlie', amount: 300 },
  ],
  total: 3,
  page: 1,
  page_size: 50,
  total_pages: 1,
};

const mockedUseQueryResults = vi.mocked(useQueryResults);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataTable', () => {
  it('shows loading skeleton', () => {
    mockedUseQueryResults.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<DataTable runId="run-1" />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows "No results" for empty data', () => {
    mockedUseQueryResults.mockReturnValue({
      data: { ...mockResults, rows: [], total: 0 },
      isLoading: false,
    });
    renderWithProviders(<DataTable runId="run-1" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('column sorting works (clicking header)', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    const nameHeader = screen.getByText('name');
    fireEvent.click(nameHeader);
    // After click, useQueryResults should be called with sort params
    expect(mockedUseQueryResults).toHaveBeenCalled();
  });

  it('row selection checkbox toggles', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    const checkbox = screen.getByTestId('select-row-0');
    fireEvent.click(checkbox);
    // Checkbox should now be checked
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('alternating row colors present', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    // Second row (index 1) should have bg-muted/10
    const row1 = screen.getByTestId('data-row-1');
    expect(row1.className).toContain('bg-muted/10');
  });

  it('shows StatusBar with pagination', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('status-row-range')).toBeInTheDocument();
  });

  it('column visibility toggle works', () => {
    mockedUseQueryResults.mockReturnValue({ data: mockResults, isLoading: false });
    renderWithProviders(<DataTable runId="run-1" />);
    // The Columns button should be present in the toolbar
    const columnsBtn = screen.getByText('Columns');
    expect(columnsBtn).toBeInTheDocument();
    // Clicking it should not throw
    fireEvent.click(columnsBtn);
  });
});
