import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface BatchControlsProps {
  paused: boolean;
  adaptiveEnabled: boolean;
  batchSizeOverride: number | null;
  targetSeconds: number;
  onPause: () => void;
  onResume: () => void;
  onSetBatchSize: (size: number) => void;
  onSetTargetSeconds: (seconds: number) => void;
  currentBatchTime?: number;
  currentRowsPerSec?: number;
}

const PRESETS = [
  { label: 'Slower (2K)', size: 2000 },
  { label: 'Balanced (10K)', size: 10000 },
  { label: 'Faster (25K)', size: 25000 },
] as const;

export function BatchControls({
  paused,
  adaptiveEnabled,
  batchSizeOverride,
  targetSeconds,
  onPause,
  onResume,
  onSetBatchSize,
  onSetTargetSeconds,
  currentBatchTime,
  currentRowsPerSec,
}: BatchControlsProps) {
  const [manualSize, setManualSize] = useState<string>(
    batchSizeOverride !== null ? String(batchSizeOverride) : ''
  );
  const [targetInput, setTargetInput] = useState<string>(String(targetSeconds));

  const handleManualSubmit = () => {
    const val = parseInt(manualSize, 10);
    if (!isNaN(val) && val > 0) {
      onSetBatchSize(val);
    }
  };

  const handleTargetChange = (value: string) => {
    setTargetInput(value);
    const val = parseFloat(value);
    if (!isNaN(val) && val > 0) {
      onSetTargetSeconds(val);
    }
  };

  const handleAdaptiveToggle = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const val = parseFloat(targetInput);
      onSetTargetSeconds(!isNaN(val) && val > 0 ? val : targetSeconds);
    } else {
      onSetBatchSize(batchSizeOverride ?? 10000);
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Batch Controls
      </h4>

      {/* Row 1: Pause / Resume */}
      <div>
        {paused ? (
          <Button size="sm" onClick={onResume}>
            <Play className="mr-1 h-3.5 w-3.5" />
            Resume
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onPause}>
            <Pause className="mr-1 h-3.5 w-3.5" />
            Pause
          </Button>
        )}
      </div>

      {/* Row 2: Presets + manual input */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.size}
            size="sm"
            variant={batchSizeOverride === preset.size ? 'default' : 'outline'}
            onClick={() => {
              onSetBatchSize(preset.size);
              setManualSize(String(preset.size));
            }}
          >
            {preset.label}
          </Button>
        ))}
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            className="h-8 w-24 text-sm"
            placeholder="Custom"
            value={manualSize}
            onChange={(e) => setManualSize(e.target.value)}
            onBlur={handleManualSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualSubmit();
            }}
          />
          <span className="text-xs text-muted-foreground">rows/batch</span>
        </div>
      </div>

      {/* Row 3: Target time + auto-adapt checkbox */}
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Target time/batch:</Label>
        <Input
          type="number"
          className="h-8 w-20 text-sm"
          value={targetInput}
          onChange={(e) => handleTargetChange(e.target.value)}
          step="0.5"
          min="0.5"
        />
        <span className="text-xs text-muted-foreground">sec</span>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="auto-adapt"
            checked={adaptiveEnabled}
            onCheckedChange={handleAdaptiveToggle}
          />
          <Label htmlFor="auto-adapt" className="text-sm cursor-pointer">
            Auto-adapt
          </Label>
        </div>
      </div>

      {/* Row 4: Stats */}
      {(currentBatchTime !== undefined || currentRowsPerSec !== undefined) && (
        <p className="text-xs text-muted-foreground">
          Current:{' '}
          {currentBatchTime !== undefined && (
            <span>~{(currentBatchTime / 1000).toFixed(1)}s/batch</span>
          )}
          {currentBatchTime !== undefined && currentRowsPerSec !== undefined && ' | '}
          {currentRowsPerSec !== undefined && (
            <span>~{Math.round(currentRowsPerSec).toLocaleString()} rows/sec</span>
          )}
        </p>
      )}
    </div>
  );
}
