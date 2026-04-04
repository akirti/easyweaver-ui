import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { ColumnHeaderMenu } from '@/components/results/ColumnHeaderMenu';

const defaultProps = {
  columnId: 'name',
  onSort: vi.fn(),
  onPin: vi.fn(),
  onHide: vi.fn(),
  onAutoSize: vi.fn(),
  onResetWidth: vi.fn(),
  pinned: false as 'left' | 'right' | false,
};

function renderMenu(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  props.onSort = overrides.onSort ?? vi.fn();
  props.onPin = overrides.onPin ?? vi.fn();
  props.onHide = overrides.onHide ?? vi.fn();
  props.onAutoSize = overrides.onAutoSize ?? vi.fn();
  props.onResetWidth = overrides.onResetWidth ?? vi.fn();
  return {
    ...renderWithProviders(
      <ColumnHeaderMenu {...props}>
        <span>Column Name</span>
      </ColumnHeaderMenu>
    ),
    props,
  };
}

describe('ColumnHeaderMenu', () => {
  it('renders children', () => {
    renderMenu();
    expect(screen.getByText('Column Name')).toBeInTheDocument();
  });

  it('opens menu on context menu (right-click)', () => {
    renderMenu();
    const wrapper = screen.getByTestId('column-header-name');
    fireEvent.contextMenu(wrapper);
    expect(screen.getByText('Sort Ascending')).toBeInTheDocument();
  });

  it('shows sort options', () => {
    renderMenu();
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    expect(screen.getByText('Sort Ascending')).toBeInTheDocument();
    expect(screen.getByText('Sort Descending')).toBeInTheDocument();
  });

  it('shows pin options', () => {
    renderMenu();
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    expect(screen.getByText('Pin Left')).toBeInTheDocument();
    expect(screen.getByText('Pin Right')).toBeInTheDocument();
  });

  it('calls onSort with correct direction', () => {
    const { props } = renderMenu();
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    fireEvent.click(screen.getByText('Sort Ascending'));
    expect(props.onSort).toHaveBeenCalledWith('asc');
  });

  it('calls onHide when Hide Column clicked', () => {
    const { props } = renderMenu();
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    fireEvent.click(screen.getByText('Hide Column'));
    expect(props.onHide).toHaveBeenCalled();
  });

  it('shows Unpin option only when pinned', () => {
    // Not pinned
    renderMenu({ pinned: false });
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    expect(screen.queryByText('Unpin')).not.toBeInTheDocument();
  });

  it('shows Unpin option when pinned left', () => {
    renderMenu({ pinned: 'left' });
    fireEvent.contextMenu(screen.getByTestId('column-header-name'));
    expect(screen.getByText('Unpin')).toBeInTheDocument();
  });
});
