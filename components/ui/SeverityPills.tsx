type SeverityPillsProps = {
  critical: number;
  warning: number;
};

export default function SeverityPills({ critical, warning }: SeverityPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="lp-badge lp-badge-block">Critical {critical}</span>
      <span className="lp-badge lp-badge-caution">Warning {warning}</span>
    </div>
  );
}
