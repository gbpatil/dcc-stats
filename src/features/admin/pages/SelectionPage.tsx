import { PagePlaceholder } from '../components/PagePlaceholder';

export function SelectionPage() {
  return (
    <PagePlaceholder
      icon="📋"
      title="Selection & Match-day"
      description="Team selection and match-day planning for admins."
      bullets={[
        'Build and share line-ups',
        'Track availability per fixture',
        'Match-day logistics and notes',
      ]}
    />
  );
}
