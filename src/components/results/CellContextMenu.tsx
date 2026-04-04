import { useState } from 'react';
import { Copy, Clipboard, Filter, FilterX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CellContextMenuProps {
  children: React.ReactNode;
  value: unknown;
  rowData: Record<string, unknown>;
  columnId: string;
  onCopyValue: () => void;
  onCopyRow: () => void;
  onFilterByValue: (columnId: string, value: unknown) => void;
  onExcludeValue: (columnId: string, value: unknown) => void;
}

export function CellContextMenu({
  children,
  value,
  rowData,
  columnId,
  onCopyValue,
  onCopyRow,
  onFilterByValue,
  onExcludeValue,
}: CellContextMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className="w-full"
          onContextMenu={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          data-testid={`cell-context-${columnId}`}
        >
          {children}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onCopyValue}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Value
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyRow}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy Row as JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFilterByValue(columnId, value)}>
          <Filter className="mr-2 h-4 w-4" />
          Filter by this value
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExcludeValue(columnId, value)}>
          <FilterX className="mr-2 h-4 w-4" />
          Exclude this value
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
