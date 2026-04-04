import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  PinIcon,
  EyeOff,
  MoreVertical,
  Check,
  Columns3,
  RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ColumnHeaderMenuProps {
  columnId: string;
  children: React.ReactNode;
  onSort: (direction: 'asc' | 'desc') => void;
  onPin: (side: 'left' | 'right' | false) => void;
  onHide: () => void;
  onAutoSize: () => void;
  onResetWidth: () => void;
  pinned: 'left' | 'right' | false;
}

export function ColumnHeaderMenu({
  columnId,
  children,
  onSort,
  onPin,
  onHide,
  onAutoSize,
  onResetWidth,
  pinned,
}: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div
        className="group relative flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        data-testid={`column-header-${columnId}`}
      >
        <div className="flex-1">{children}</div>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'ml-1 rounded p-0.5 hover:bg-muted',
              hovered || open ? 'opacity-100' : 'opacity-0'
            )}
            data-testid={`column-menu-trigger-${columnId}`}
            aria-label={`Column menu for ${columnId}`}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
      </div>

      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSort('asc')}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Sort Ascending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort('desc')}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Sort Descending
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onPin('left')}>
          {pinned === 'left' && <Check className="mr-2 h-4 w-4" />}
          {pinned !== 'left' && <PinIcon className="mr-2 h-4 w-4" />}
          Pin Left
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPin('right')}>
          {pinned === 'right' && <Check className="mr-2 h-4 w-4" />}
          {pinned !== 'right' && <PinIcon className="mr-2 h-4 w-4" />}
          Pin Right
        </DropdownMenuItem>
        {pinned && (
          <DropdownMenuItem onClick={() => onPin(false)}>
            <PinIcon className="mr-2 h-4 w-4" />
            Unpin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHide}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Column
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAutoSize}>
          <Columns3 className="mr-2 h-4 w-4" />
          Auto-size Column
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetWidth}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Width
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
