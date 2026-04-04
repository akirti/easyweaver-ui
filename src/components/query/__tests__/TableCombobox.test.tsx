import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { TableCombobox } from '@/components/query/TableCombobox';
import type { TableSchema } from '@/types';

// cmdk uses scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

const mockTables: TableSchema[] = [
  { name: 'public.users', row_estimate: 5000, columns: [] },
  { name: 'public.orders', row_estimate: 1500000, columns: [] },
  { name: 'analytics.events', row_estimate: 50000, columns: [] },
  { name: 'staging.temp', row_estimate: 100, columns: [] },
];

const defaultProps = {
  tables: mockTables,
  value: null,
  onValueChange: vi.fn(),
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('TableCombobox', () => {
  it('renders with placeholder when no value', () => {
    renderWithProviders(<TableCombobox {...defaultProps} />);
    expect(screen.getByTestId('table-combobox-trigger')).toHaveTextContent('Select table...');
  });

  it('shows selected table name when value is set', () => {
    renderWithProviders(<TableCombobox {...defaultProps} value="public.users" />);
    expect(screen.getByTestId('table-combobox-trigger')).toHaveTextContent('public.users');
  });

  it('opens popover on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));

    expect(screen.getByTestId('table-combobox-input')).toBeInTheDocument();
    for (const table of mockTables) {
      expect(screen.getByTestId(`table-option-${table.name}`)).toBeInTheDocument();
    }
  });

  it('filters tables by search text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));
    await user.type(screen.getByTestId('table-combobox-input'), 'users');

    expect(screen.getByTestId('table-option-public.users')).toBeInTheDocument();
    expect(screen.queryByTestId('table-option-public.orders')).not.toBeInTheDocument();
    expect(screen.queryByTestId('table-option-analytics.events')).not.toBeInTheDocument();
  });

  it('shows "No tables found" for empty search results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));
    await user.type(screen.getByTestId('table-combobox-input'), 'nonexistenttable');

    expect(screen.getByTestId('table-combobox-empty')).toHaveTextContent('No tables found');
  });

  it('calls onValueChange when table is selected', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} onValueChange={onValueChange} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));
    await user.click(screen.getByTestId('table-option-public.users'));

    expect(onValueChange).toHaveBeenCalledWith('public.users');
  });

  it('shows size indicator dots with correct colors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));

    // green: <10K rows
    const greenDot = screen.getByTestId('table-size-staging.temp');
    expect(greenDot.className).toContain('bg-green-500');

    const greenDot2 = screen.getByTestId('table-size-public.users');
    expect(greenDot2.className).toContain('bg-green-500');

    // yellow: <1M rows
    const yellowDot = screen.getByTestId('table-size-analytics.events');
    expect(yellowDot.className).toContain('bg-yellow-500');

    // red: >=1M rows
    const redDot = screen.getByTestId('table-size-public.orders');
    expect(redDot.className).toContain('bg-red-500');
  });

  it('shows row estimates', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} />);

    await user.click(screen.getByTestId('table-combobox-trigger'));

    expect(screen.getByText(/~5,000 rows/)).toBeInTheDocument();
    expect(screen.getByText(/~1,500,000 rows/)).toBeInTheDocument();
    expect(screen.getByText(/~50,000 rows/)).toBeInTheDocument();
    expect(screen.getByText(/~100 rows/)).toBeInTheDocument();
  });

  it('disabled state works', () => {
    renderWithProviders(<TableCombobox {...defaultProps} disabled />);

    const trigger = screen.getByTestId('table-combobox-trigger');
    expect(trigger).toBeDisabled();
  });

  it('shows check icon for selected item', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TableCombobox {...defaultProps} value="public.users" />);

    await user.click(screen.getByTestId('table-combobox-trigger'));

    const selectedCheck = screen.getByTestId('table-check-public.users');
    expect(selectedCheck).toHaveClass('opacity-100');

    const unselectedCheck = screen.getByTestId('table-check-public.orders');
    expect(unselectedCheck).toHaveClass('opacity-0');
  });
});
