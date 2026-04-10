import { Button } from '@/components/ui/button';

interface Props {
  value: boolean | null;
  onChange: (v: boolean) => void;
  variant?: 'yesno' | 'truefalse';
}

export function FilterBooleanToggle({ value, onChange, variant = 'truefalse' }: Props) {
  const trueLabel = variant === 'yesno' ? 'Yes' : 'true';
  const falseLabel = variant === 'yesno' ? 'No' : 'false';

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant={value === true ? 'default' : 'outline'}
        onClick={() => onChange(true)}
      >
        {trueLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === false ? 'default' : 'outline'}
        onClick={() => onChange(false)}
      >
        {falseLabel}
      </Button>
    </div>
  );
}
