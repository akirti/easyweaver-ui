import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { ColumnPicker } from '@/components/query/ColumnPicker';
import type { ColumnInfo } from '@/types';

const mockColumns: ColumnInfo[] = [
  { name: 'id', type: 'integer', nullable: false, primary_key: true },
  { name: 'name', type: 'character varying', nullable: false, primary_key: false },
  { name: 'email', type: 'text', nullable: true, primary_key: false },
  { name: 'age', type: 'integer', nullable: true, primary_key: false },
  { name: 'created_at', type: 'timestamp with time zone', nullable: false, primary_key: false },
  { name: 'is_active', type: 'boolean', nullable: false, primary_key: false },
];

const defaultProps = {
  columns: mockColumns,
  selected: ['id', 'name'],
  pinned: [] as string[],
  onSelectedChange: vi.fn(),
  onPinnedChange: vi.fn(),
};

function renderPicker(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  // Reset mocks
  props.onSelectedChange = overrides.onSelectedChange ?? vi.fn();
  props.onPinnedChange = overrides.onPinnedChange ?? vi.fn();
  return { ...renderWithProviders(<ColumnPicker {...props} />), props };
}

describe('ColumnPicker', () => {
  it('renders search input and type filter chips', () => {
    renderPicker();
    expect(screen.getByPlaceholderText('Search columns...')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('DateTime')).toBeInTheDocument();
    expect(screen.getByText('Boolean')).toBeInTheDocument();
  });

  it('shows selected and available columns correctly', () => {
    renderPicker();
    // Count indicator
    expect(screen.getByText('2/6 selected')).toBeInTheDocument();
    // Available columns should include the unselected ones
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('created_at')).toBeInTheDocument();
    expect(screen.getByText('is_active')).toBeInTheDocument();
  });

  it('search filters columns by name (debounced)', async () => {
    renderPicker({ selected: [] });
    const input = screen.getByPlaceholderText('Search columns...');

    await userEvent.type(input, 'email');

    await waitFor(() => {
      // Only email should show
      const emailElements = screen.getAllByText('email');
      expect(emailElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.queryByText('age')).not.toBeInTheDocument();
    });
  });

  it('type filter chips filter columns by type category', async () => {
    renderPicker({ selected: [] });

    // Click "Numeric" filter
    await userEvent.click(screen.getByText('Numeric'));

    await waitFor(() => {
      // Only numeric columns (id, age) should be visible
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('age')).toBeInTheDocument();
    });

    // Text columns should not be visible
    expect(screen.queryByText('email')).not.toBeInTheDocument();
  });

  it('clicking "+" on available column adds it to selected', async () => {
    const { props } = renderPicker();

    const addButton = screen.getByLabelText('Add email');
    await userEvent.click(addButton);

    expect(props.onSelectedChange).toHaveBeenCalledWith(['id', 'name', 'email']);
  });

  it('clicking "x" on selected column removes it', async () => {
    const { props } = renderPicker();

    const removeButton = screen.getByLabelText('Remove name');
    await userEvent.click(removeButton);

    expect(props.onSelectedChange).toHaveBeenCalledWith(['id']);
  });

  it('Select All selects all columns', async () => {
    const { props } = renderPicker();

    await userEvent.click(screen.getByText('Select All'));

    expect(props.onSelectedChange).toHaveBeenCalledWith(
      mockColumns.map((c) => c.name),
    );
  });

  it('Deselect All keeps only first column', async () => {
    const { props } = renderPicker({ selected: mockColumns.map((c) => c.name) });

    await userEvent.click(screen.getByText('Deselect All'));

    expect(props.onSelectedChange).toHaveBeenCalledWith(['id']);
  });

  it('pin toggle works', async () => {
    const { props } = renderPicker();

    const pinButton = screen.getByLabelText('Pin id');
    await userEvent.click(pinButton);

    expect(props.onPinnedChange).toHaveBeenCalledWith(['id']);
  });

  it('renders TypeBadge with correct styling', () => {
    renderPicker();
    // Multiple integer columns exist so use getAllByLabelText
    const intBadges = screen.getAllByLabelText('Type: integer');
    expect(intBadges.length).toBeGreaterThan(0);
    expect(intBadges[0].className).toMatch(/indigo/);
  });
});
