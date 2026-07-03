import { PagePlaceholder } from '../components/PagePlaceholder';

export function AnalyticsPage() {
  return (
    <PagePlaceholder
      icon="📈"
      title="Advanced Analytics"
      description="Internal stats, trends and visualisations beyond the public reports."
      bullets={[
        'Season-over-season performance trends',
        'Per-player deep dives and form guides',
        'Custom charts not shown on the public site',
      ]}
    />
  );
}
