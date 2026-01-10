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
import styles from './App.module.css';

function App() {
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [season, setSeason] = useState(2025);
  const availableSeasons = useAvailableSeasons();
  
  // Initialize with first primary report
  useEffect(() => {
    const primaryReports = getPrimaryReports();
    if (primaryReports.length > 0 && !activeReport) {
      setActiveReport(primaryReports[0]);
    }
  }, [activeReport]);

  const { data, loading, error } = useReportData(activeReport, season);

  return (
    <div className={styles.app}>
      <Header 
        season={season} 
        onSeasonChange={setSeason} 
        availableSeasons={availableSeasons} 
      />
      
      <TabNavigation 
        activeReport={activeReport} 
        onReportChange={setActiveReport} 
      />
      
      <main className={styles.main}>
        <StatsTable 
          data={data} 
          report={activeReport} 
          loading={loading} 
          error={error} 
        />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
