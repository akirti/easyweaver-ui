import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { QuickSwitcher } from '@/components/query/QuickSwitcher';
import type { Source, TableSchema } from '@/types';

// cmdk uses scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

const mockSources: Source[] = [
  { id: 's1', name: 'Production DB', source_type: 'postgres', created_at: '', updated_at: '' },
  { id: 's2', name: 'Staging DB', source_type: 'postgres', created_at: '', updated_at: '' },
];

const mockTables: TableSchema[] = [
  { name: 'public.users', row_estimate: 5000, columns: [] },
  { name: 'public.orders', row_estimate: 1500000, columns: [] },
  { name: 'analytics.events', row_estimate: 50000, columns: [] },
  { name: 'staging.temp_data', row_estimate: 100, columns: [] },
];

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  sources: mockSources,
  currentSourceId: 's1',
  onSourceSelect: vi.fn(),
  tables: mockTables,
  currentTable: null,
  onTableSelect: vi.fn(),
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('QuickSwitcher', () => {
  it('renders when open=true', () => {
    renderWithProviders(<QuickSwitcher {...defaultProps} />);
    expect(screen.getByTestId('quick-switcher-input')).toBeInTheDocument();
  });

  it('does not render content when open=false', () => {
    renderWithProviders(<QuickSwitcher {...defaultProps} open={false} />);
    expect(screen.queryByTestId('quick-switcher-input')).not.toBeInTheDocument();
  });

  it('shows connections in command list', () => {
    renderWithProviders(<QuickSwitcher {...defaultProps} />);
    expect(screen.getByTestId('source-item-s1')).toBeInTheDocument();
    expect(screen.getByTestId('source-item-s2')).toBeInTheDocument();
    expect(screen.getByText('Production DB')).toBeInTheDocument();
    expect(screen.getByText('Staging DB')).toBeInTheDocument();
  });

  it('shows tables in command list', () => {
    renderWithProviders(<QuickSwitcher {...defaultProps} />);
    expect(screen.getByTestId('table-item-public.users')).toBeInTheDocument();
    expect(screen.getByTestId('table-item-public.orders')).toBeInTheDocument();
  });

  it('marks current source with "current" indicator', () => {
    renderWithProviders(<QuickSwitcher {...defaultProps} currentSourceId="s1" />);
    expect(screen.getByTestId('current-source-s1')).toHaveTextContent('current');
    expect(screen.queryByTestId('current-source-s2')).not.toBeInTheDocument();
  });

  it('calls onSourceSelect when connection is clicked', async () => {
    const onSourceSelect = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <QuickSwitcher
        {...defaultProps}
        onSourceSelect={onSourceSelect}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByTestId('source-item-s2'));
    expect(onSourceSelect).toHaveBeenCalledWith('s2');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onTableSelect when table is clicked', async () => {
    const onTableSelect = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <QuickSwitcher
        {...defaultProps}
        onTableSelect={onTableSelect}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByTestId('table-item-public.users'));
    expect(onTableSelect).toHaveBeenCalledWith('public.users');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) after selection', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <QuickSwitcher {...defaultProps} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByTestId('source-item-s1'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
