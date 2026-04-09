import { Check } from 'lucide-react';

interface PhaseIndicatorProps {
  phase: string | null;
  phaseIndex: number;
  totalPhases: number;
}

const PHASE_LABELS: Record<string, string> = {
  fetching: 'Fetching',
  joining: 'Joining',
  transforming: 'Transforming',
};

export function PhaseIndicator({ phase, phaseIndex, totalPhases }: PhaseIndicatorProps) {
  if (totalPhases === 0) return null;

  // Build phase list from known phases or fall back to generic labels
  const phases = ['fetching', 'joining', 'transforming'].slice(0, totalPhases);

  return (
    <div className="flex items-center gap-2">
      {phases.map((p, idx) => {
        const isCompleted = idx < phaseIndex;
        const isCurrent = idx === phaseIndex && phase === p;
        const isFuture = !isCompleted && !isCurrent;

        return (
          <div key={p} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className={`h-px w-6 ${isCompleted ? 'bg-green-400' : isCurrent ? 'bg-blue-400' : 'bg-gray-300'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : isCurrent
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-xs ${
                  isCurrent
                    ? 'font-medium text-blue-700 dark:text-blue-400'
                    : isFuture
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-green-700 dark:text-green-400'
                }`}
              >
                {PHASE_LABELS[p] ?? p}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
