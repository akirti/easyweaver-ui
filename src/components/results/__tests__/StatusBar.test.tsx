import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { StatusBar } from '@/components/results/StatusBar';

const defaultProps = {
  totalRows: 150,
  visibleRows: 50,
  selectedCount: 0,
  page: 2,
  totalPages: 6,
  pageSize: 25,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

function renderStatusBar(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  // Reset mocks for each render
  props.onPageChange = overrides.onPageChange ?? vi.fn();
  props.onPageSizeChange = overrides.onPageSizeChange ?? vi.fn();
  return { ...renderWithProviders(<StatusBar {...props} />), props };
}

describe('StatusBar', () => {
  it('shows correct row range', () => {
    renderStatusBar();
    expect(screen.getByTestId('status-row-range')).toHaveTextContent('Showing 26-50 of 150');
  });

  it('shows selected count when > 0', () => {
    renderStatusBar({ selectedCount: 5 });
    expect(screen.getByTestId('status-selected')).toHaveTextContent('(5 selected)');
  });

  it('does not show selected count when 0', () => {
    renderStatusBar({ selectedCount: 0 });
    expect(screen.queryByTestId('status-selected')).not.toBeInTheDocument();
  });

  it('shows aggregation stats', () => {
    const aggregations = {
      amount: { type: 'numeric', sum: 12345.67, avg: 617.28, count: 20, unique: 18 },
      price: { type: 'numeric', sum: 999, avg: 49.95, count: 20, unique: 15 },
    };
    renderStatusBar({ aggregations });
    const aggSection = screen.getByTestId('status-aggregations');
    expect(aggSection).toHaveTextContent('amount');
    expect(aggSection).toHaveTextContent('price');
  });

  it('disables Previous button on first page', () => {
    renderStatusBar({ page: 1 });
    expect(screen.getByTestId('status-prev')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    renderStatusBar({ page: 6, totalPages: 6 });
    expect(screen.getByTestId('status-next')).toBeDisabled();
  });

  it('calls onPageChange when clicking Next', () => {
    const { props } = renderStatusBar({ page: 2, totalPages: 6 });
    fireEvent.click(screen.getByTestId('status-next'));
    expect(props.onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when clicking Previous', () => {
    const { props } = renderStatusBar({ page: 3, totalPages: 6 });
    fireEvent.click(screen.getByTestId('status-prev'));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows query time when provided', () => {
    renderStatusBar({ queryTime: 0.832 });
    expect(screen.getByTestId('status-query-time')).toHaveTextContent('0.8s');
  });

  it('does not show query time when not provided', () => {
    renderStatusBar();
    expect(screen.queryByTestId('status-query-time')).not.toBeInTheDocument();
  });

  it('shows page info', () => {
    renderStatusBar({ page: 3, totalPages: 10 });
    expect(screen.getByTestId('status-page-info')).toHaveTextContent('Page 3 of 10');
  });
});
