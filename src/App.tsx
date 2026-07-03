import { useState } from 'react';
import { Header, Footer } from '@/components';
import {
  TabNavigation,
  StatsTable,
  useReportData,
  useAvailableSeasons,
  getPrimaryReports,
} from '@/features/stats';
import type { Report } from '@/features/stats';
import { RotationPage } from '@/features/rotation';
import type { AppView } from '@/components';
import { isFeatureEnabled } from '@/utils';
import styles from './App.module.css';

function App() {
  // Rotation tab is shown only while ?feat=rotation is present in the URL.
  const [rotationEnabled] = useState(() => isFeatureEnabled('rotation'));
  // Land on the rotation tab when the feature is requested in the URL.
  const [view, setView] = useState<AppView>(() => (rotationEnabled ? 'rotation' : 'stats'));
  // Start on the first primary report (computed once, lazily).
  const [activeReport, setActiveReport] = useState<Report | null>(
    () => getPrimaryReports()[0] ?? null,
  );
  const [season, setSeason] = useState(() => new Date().getFullYear());
  const availableSeasons = useAvailableSeasons();

  const { data, loading, error } = useReportData(activeReport, season);

  // Never land on the rotation view unless the feature is unlocked.
  const effectiveView: AppView = rotationEnabled ? view : 'stats';

  return (
    <div className={styles.app}>
      <Header
        season={season}
        onSeasonChange={setSeason}
        availableSeasons={availableSeasons}
        view={effectiveView}
        onViewChange={setView}
        showRotationTab={rotationEnabled}
      />

      {effectiveView === 'stats' ? (
        <>
          <TabNavigation
            activeReport={activeReport}
            onReportChange={setActiveReport}
          />

          <main className={styles.main}>
            <StatsTable
              key={activeReport?.id}
              data={data}
              report={activeReport}
              loading={loading}
              error={error}
            />
          </main>
        </>
      ) : (
        <main className={styles.main}>
          <RotationPage season={season} />
        </main>
      )}

      <Footer />
    </div>
  );
}

export default App;
