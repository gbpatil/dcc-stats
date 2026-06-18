import { useState, useEffect } from 'react';
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
import { isFeatureEnabled, isFeatureRequestedInUrl } from '@/utils';
import styles from './App.module.css';

function App() {
  // Rotation tab is hidden unless unlocked via ?feat=rotation (remembered per device).
  const [rotationEnabled] = useState(() => isFeatureEnabled('rotation'));
  // Land on the rotation tab when the feature is explicitly requested in the URL.
  const [view, setView] = useState<AppView>(() =>
    isFeatureRequestedInUrl('rotation') ? 'rotation' : 'stats',
  );
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [season, setSeason] = useState(() => new Date().getFullYear());
  const availableSeasons = useAvailableSeasons();
  
  // Initialize with first primary report
  useEffect(() => {
    const primaryReports = getPrimaryReports();
    if (primaryReports.length > 0 && !activeReport) {
      setActiveReport(primaryReports[0]);
    }
  }, [activeReport]);

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
