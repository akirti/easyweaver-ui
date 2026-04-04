import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { TableBrowser } from '@/components/query/TableBrowser';
import type { TableSchema } from '@/types';

const mockTables: TableSchema[] = [
  { name: 'public.users', row_estimate: 5000, columns: [] },
  { name: 'public.orders', row_estimate: 1500000, columns: [] },
  { name: 'analytics.events', row_estimate: 50000, columns: [] },
  { name: 'staging.temp_data', row_estimate: 100, columns: [] },
];

const defaultProps = {
  tables: mockTables,
  selectedTable: null,
  onTableSelect: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('TableBrowser', () => {
  it('renders search input', () => {
    renderWithProviders(<TableBrowser {...defaultProps} />);
    expect(screen.getByTestId('table-search-input')).toBeInTheDocument();
  });

  it('shows all tables when no search', () => {
    renderWithProviders(<TableBrowser {...defaultProps} />);
    for (const table of mockTables) {
      expect(screen.getByTestId(`table-row-${table.name}`)).toBeInTheDocument();
    }
  });

  it('filters tables by search text (case-insensitive)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableBrowser {...defaultProps} />);

    const input = screen.getByTestId('table-search-input');
    await user.type(input, 'USERS');

    expect(screen.getByTestId('table-row-public.users')).toBeInTheDocument();
    expect(screen.queryByTestId('table-row-public.orders')).not.toBeInTheDocument();
    expect(screen.queryByTestId('table-row-analytics.events')).not.toBeInTheDocument();
  });

  it('groups tables by schema prefix', () => {
    renderWithProviders(<TableBrowser {...defaultProps} />);

    expect(screen.getByTestId('group-header-public')).toBeInTheDocument();
    expect(screen.getByTestId('group-header-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('group-header-staging')).toBeInTheDocument();
  });

  it('shows row count estimates', () => {
    renderWithProviders(<TableBrowser {...defaultProps} />);
    // 5000 formatted as locale string
    expect(screen.getByText(/5,000 rows/)).toBeInTheDocument();
    expect(screen.getByText(/1,500,000 rows/)).toBeInTheDocument();
  });

  it('shows size indicator colors (green/yellow/red)', () => {
    renderWithProviders(<TableBrowser {...defaultProps} />);

    const greenIndicator = screen.getByTestId('size-indicator-staging.temp_data');
    expect(greenIndicator.className).toContain('bg-green-500');

    const yellowIndicator = screen.getByTestId('size-indicator-analytics.events');
    expect(yellowIndicator.className).toContain('bg-yellow-500');

    const redIndicator = screen.getByTestId('size-indicator-public.orders');
    expect(redIndicator.className).toContain('bg-red-500');
  });

  it('calls onTableSelect when table is clicked', async () => {
    const onTableSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <TableBrowser {...defaultProps} onTableSelect={onTableSelect} />
    );

    await user.click(screen.getByTestId('table-row-public.users'));
    expect(onTableSelect).toHaveBeenCalledWith('public.users');
  });

  it('shows loading skeleton when isLoading', () => {
    renderWithProviders(
      <TableBrowser {...defaultProps} isLoading={true} />
    );
    expect(screen.getByTestId('table-browser-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('table-search-input')).not.toBeInTheDocument();
  });

  it('handles empty tables array', () => {
    renderWithProviders(
      <TableBrowser {...defaultProps} tables={[]} />
    );
    expect(screen.getByText('No tables available')).toBeInTheDocument();
  });

  it('favorites toggle works', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithProviders(<TableBrowser {...defaultProps} />);

    const starButton = screen.getByTestId('star-toggle-public.users');
    await user.click(starButton);

    expect(setItemSpy).toHaveBeenCalledWith(
      'easyweaver-favorite-tables',
      expect.stringContaining('public.users')
    );
  });

  it('recently used tables show at top after selection', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithProviders(<TableBrowser {...defaultProps} />);

    await user.click(screen.getByTestId('table-row-analytics.events'));

    expect(setItemSpy).toHaveBeenCalledWith(
      'easyweaver-recent-tables',
      expect.stringContaining('analytics.events')
    );
  });
});
