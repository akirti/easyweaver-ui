import { renderWithProviders, screen } from '@/test/test-utils';
import { ColumnPreviewCard } from '@/components/query/ColumnPreviewCard';
import type { ColumnInfo } from '@/types';

const pkColumn: ColumnInfo = {
  name: 'id',
  type: 'integer',
  nullable: false,
  primary_key: true,
};

const nullableColumn: ColumnInfo = {
  name: 'email',
  type: 'text',
  nullable: true,
  primary_key: false,
};

describe('ColumnPreviewCard', () => {
  it('renders column name', () => {
    renderWithProviders(<ColumnPreviewCard column={pkColumn} />);
    expect(screen.getByText('id')).toBeInTheDocument();
  });

  it('shows type badge', () => {
    renderWithProviders(<ColumnPreviewCard column={pkColumn} />);
    expect(screen.getByLabelText('Type: integer')).toBeInTheDocument();
  });

  it('shows nullable status as yes when nullable', () => {
    renderWithProviders(<ColumnPreviewCard column={nullableColumn} />);
    expect(screen.getByText('Nullable: yes')).toBeInTheDocument();
  });

  it('shows nullable status as no when not nullable', () => {
    renderWithProviders(<ColumnPreviewCard column={pkColumn} />);
    expect(screen.getByText('Nullable: no')).toBeInTheDocument();
  });

  it('shows primary key indicator for primary key columns', () => {
    renderWithProviders(<ColumnPreviewCard column={pkColumn} />);
    expect(screen.getByLabelText('Primary key')).toBeInTheDocument();
    expect(screen.getByText('Primary key: yes')).toBeInTheDocument();
  });

  it('shows primary key as no for non-primary-key columns', () => {
    renderWithProviders(<ColumnPreviewCard column={nullableColumn} />);
    expect(screen.getByText('Primary key: no')).toBeInTheDocument();
  });
});
