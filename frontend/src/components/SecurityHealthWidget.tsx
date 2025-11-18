import { Shield, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SecurityHealthWidgetProps {
  weakCount: number;
  reusedCount: number;
  totalCount: number;
}

export function SecurityHealthWidget({ weakCount, reusedCount, totalCount }: SecurityHealthWidgetProps) {
  const issuesCount = weakCount + reusedCount;
  const healthScore = Math.max(0, Math.round(((totalCount - issuesCount) / totalCount) * 100));
  
  let healthColor = 'text-green-400';
  let healthBg = 'bg-green-400';
  if (healthScore < 50) {
    healthColor = 'text-red-400';
    healthBg = 'bg-red-400';
  } else if (healthScore < 80) {
    healthColor = 'text-yellow-400';
    healthBg = 'bg-yellow-400';
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-neutral-400" />
          <h3 className="text-sm">Security Health</h3>
        </div>
        <span className={`${healthColor}`}>{healthScore}%</span>
      </div>

      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${healthBg} transition-all duration-300`}
          style={{ width: `${healthScore}%` }}
        />
      </div>

      <div className="space-y-2">
        {weakCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="size-3.5 text-red-400" />
            <span className="text-neutral-300">
              {weakCount} weak {weakCount === 1 ? 'password' : 'passwords'}
            </span>
          </div>
        )}
        
        {reusedCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="size-3.5 text-yellow-400" />
            <span className="text-neutral-300">
              {reusedCount} reused {reusedCount === 1 ? 'password' : 'passwords'}
            </span>
          </div>
        )}

        {issuesCount === 0 && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="size-3.5 text-green-400" />
            <span className="text-neutral-300">All passwords are secure</span>
          </div>
        )}
      </div>
    </div>
  );
}