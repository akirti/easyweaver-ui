import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { CellContextMenu } from '@/components/results/CellContextMenu';

const defaultProps = {
  value: 'test value',
  rowData: { id: 1, name: 'Alice', amount: 100 },
  columnId: 'name',
  onCopyValue: vi.fn(),
  onCopyRow: vi.fn(),
  onFilterByValue: vi.fn(),
  onExcludeValue: vi.fn(),
};

function renderMenu(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return {
    ...renderWithProviders(
      <CellContextMenu {...props}>
        <span>Cell Content</span>
      </CellContextMenu>
    ),
    props,
  };
}

describe('CellContextMenu', () => {
  it('renders children', () => {
    renderMenu();
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });

  it('opens menu on right-click', () => {
    renderMenu();
    fireEvent.contextMenu(screen.getByTestId('cell-context-name'));
    expect(screen.getByText('Copy Value')).toBeInTheDocument();
  });

  it('Copy value calls onCopyValue', () => {
    const { props } = renderMenu();
    fireEvent.contextMenu(screen.getByTestId('cell-context-name'));
    fireEvent.click(screen.getByText('Copy Value'));
    expect(props.onCopyValue).toHaveBeenCalled();
  });

  it('Copy row calls onCopyRow', () => {
    const { props } = renderMenu();
    fireEvent.contextMenu(screen.getByTestId('cell-context-name'));
    fireEvent.click(screen.getByText('Copy Row as JSON'));
    expect(props.onCopyRow).toHaveBeenCalled();
  });

  it('Filter by value calls onFilterByValue with correct args', () => {
    const { props } = renderMenu({ value: 'Alice', columnId: 'name' });
    fireEvent.contextMenu(screen.getByTestId('cell-context-name'));
    fireEvent.click(screen.getByText('Filter by this value'));
    expect(props.onFilterByValue).toHaveBeenCalledWith('name', 'Alice');
  });

  it('Exclude value calls onExcludeValue with correct args', () => {
    const { props } = renderMenu({ value: 'Bob', columnId: 'name' });
    fireEvent.contextMenu(screen.getByTestId('cell-context-name'));
    fireEvent.click(screen.getByText('Exclude this value'));
    expect(props.onExcludeValue).toHaveBeenCalledWith('name', 'Bob');
  });
});
