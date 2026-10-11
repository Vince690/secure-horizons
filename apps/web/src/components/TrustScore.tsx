import { scoreColor } from "./ui";

export function TrustScore({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const color = scoreColor(score);
  const barColor = score >= 70 ? "bg-ok" : score >= 40 ? "bg-warn" : "bg-crit";
  return (
    <div className="flex flex-col gap-1">
      <span className={`tabular font-bold ${size === "lg" ? "text-4xl" : "text-2xl"} ${color}`}>
        {score}
        <span className="text-base font-normal text-muted">/100</span>
      </span>
      <div className="h-1.5 w-full rounded-full bg-surface-2">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
