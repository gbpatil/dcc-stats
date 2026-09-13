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
import { StarringsPage } from '@/features/starrings';
import type { AppView } from '@/components';
import styles from './App.module.css';

function App() {
  const [view, setView] = useState<AppView>('stats');
  // Start on the first primary report (computed once, lazily).
  const [activeReport, setActiveReport] = useState<Report | null>(
    () => getPrimaryReports()[0] ?? null,
  );
  const [season, setSeason] = useState(() => new Date().getFullYear());
  const availableSeasons = useAvailableSeasons();

  const { data, loading, error } = useReportData(activeReport, season);

  return (
    <div className={styles.app}>
      <Header
        season={season}
        onSeasonChange={setSeason}
        availableSeasons={availableSeasons}
        view={view}
        onViewChange={setView}
      />

      {view === 'stats' && (
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
      )}

      {view === 'starrings' && (
        <main className={styles.main}>
          <StarringsPage />
        </main>
      )}

      <Footer />
    </div>
  );
}

export default App;
