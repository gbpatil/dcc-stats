import { PagePlaceholder } from '../components/PagePlaceholder';

export function PlayerManagementPage() {
  return (
    <PagePlaceholder
      icon="🧑"
      title="Player Management"
      description="Internal roster data not shown publicly."
      bullets={[
        'Player profiles and contact details',
        'Availability and membership status',
        'Notes and history per player',
      ]}
    />
  );
}
