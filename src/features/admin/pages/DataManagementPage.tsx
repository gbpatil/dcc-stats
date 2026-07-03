import { PagePlaceholder } from '../components/PagePlaceholder';

export function DataManagementPage() {
  return (
    <PagePlaceholder
      icon="🗂️"
      title="Data & Content Management"
      description="Curate what the public site shows."
      bullets={[
        'Choose which reports are publicly visible',
        'Post announcements and notices',
        'Edit or annotate data shown on the site',
      ]}
    />
  );
}
