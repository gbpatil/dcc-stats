import type { Report, StatsRow, ColumnConfig } from '../../types';
import { Spinner } from '@/components/ui';
import styles from './StatsTable.module.css';

interface StatsTableProps {
  data: StatsRow[];
  report: Report | null;
  loading: boolean;
  error: string | null;
}

// Common column label mappings
const COLUMN_LABELS: Record<string, { label: string; title?: string }> = {
  no: { label: '#' },
  name: { label: 'Player' },
  last_team: { label: 'Team' },
  mts: { label: 'M', title: 'Matches' },
  inns: { label: 'Inn', title: 'Innings' },
  nos: { label: 'NO', title: 'Not Outs' },
  runs: { label: 'Runs' },
  hs: { label: 'HS', title: 'Highest Score' },
  avg: { label: 'Avg', title: 'Average' },
  sr: { label: 'SR', title: 'Strike Rate' },
  '100s': { label: '100s', title: 'Centuries' },
  '50s': { label: '50s', title: 'Half Centuries' },
  '0s': { label: '0s', title: 'Ducks' },
  '4s': { label: '4s', title: 'Fours' },
  '6s': { label: '6s', title: 'Sixes' },
  balls: { label: 'Balls' },
  overs: { label: 'Overs' },
  mdns: { label: 'Mdns', title: 'Maidens' },
  wkts: { label: 'Wkts', title: 'Wickets' },
  econ: { label: 'Econ', title: 'Economy Rate' },
  bb: { label: 'BB', title: 'Best Bowling' },
  '5w': { label: '5W', title: '5 Wicket Hauls' },
  '4w': { label: '4W', title: '4 Wicket Hauls' },
  catches: { label: 'Ct', title: 'Catches' },
  stumpings: { label: 'St', title: 'Stumpings' },
  runouts: { label: 'RO', title: 'Run Outs' },
  total: { label: 'Total' },
  opposition: { label: 'Opposition' },
  venue: { label: 'Venue' },
  date: { label: 'Date' },
  season: { label: 'Season' },
  wkt: { label: 'Wkt', title: 'Wicket' },
  bat1: { label: 'Batsman 1' },
  bat2: { label: 'Batsman 2' },
  team: { label: 'Team' },
  score: { label: 'Score' },
  wins: { label: 'Wins' },
  losses: { label: 'Losses' },
  points: { label: 'Points' },
  position: { label: 'Pos', title: 'Position' },
  bat_avg: { label: 'Bat Avg', title: 'Batting Average' },
  bowl_avg: { label: 'Bowl Avg', title: 'Bowling Average' },
};

// Columns that should be highlighted
const HIGHLIGHT_COLUMNS = ['runs', 'wkts', 'avg', 'total', 'score', 'points', 'catches'];

// Columns that contain player names
const NAME_COLUMNS = ['name', 'bat1', 'bat2', 'player'];

/**
 * Auto-detect columns from data
 */
function detectColumns(data: StatsRow[]): ColumnConfig[] {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  
  return keys.map(key => {
    const labelInfo = COLUMN_LABELS[key] || { label: formatColumnKey(key) };
    const isHighlight = HIGHLIGHT_COLUMNS.includes(key);
    
    // Determine minimum width based on key type - columns will expand as needed
    let width = '70px';
    if (key === 'no') width = '50px';
    else if (key === 'name' || key === 'player') width = '160px';
    else if (key === 'bat1' || key === 'bat2') width = '150px';
    else if (key === 'last_team' || key === 'team') width = '130px';
    else if (key === 'opposition') width = '160px';
    else if (key === 'venue') width = '150px';
    else if (key === 'date') width = '100px';
    else if (key === 'season') width = '80px';
    else if (['mts', 'inns', 'nos', '4s', '6s', '100s', '50s', '0s', '5w', '4w', 'wkt'].includes(key)) width = '55px';
    else if (['avg', 'sr', 'econ', 'bat_avg', 'bowl_avg'].includes(key)) width = '70px';
    else if (['runs', 'wkts', 'balls', 'overs', 'catches', 'stumpings', 'runouts'].includes(key)) width = '65px';
    else if (key === 'hs' || key === 'bb') width = '75px';
    else if (key === 'score' || key === 'total' || key === 'points') width = '80px';
    
    return {
      key,
      label: labelInfo.label,
      title: labelInfo.title,
      width,
      highlight: isHighlight,
    };
  });
}

/**
 * Format a column key into a readable label
 */
function formatColumnKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format a cell value for display
 */
function formatValue(value: unknown, key: string): string {
  if (value === null || value === undefined || value === '') return '-';
  
  if (typeof value === 'number') {
    if (['avg', 'econ', 'sr', 'bat_avg', 'bowl_avg'].includes(key)) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  
  return String(value);
}

/**
 * Get rank badge emoji
 */
function getRankBadge(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export function StatsTable({ data, report, loading, error }: StatsTableProps) {
  const columns = detectColumns(data);

  if (loading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" label={`Loading ${report?.title || 'stats'}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.errorState}>
          <span className={styles.stateIcon}>⚠️</span>
          <h3 className={styles.stateTitle}>Unable to load data</h3>
          <p className={styles.stateMessage}>{error}</p>
          <p className={styles.stateHint}>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.emptyState}>
          <span className={styles.stateIcon}>👆</span>
          <h3 className={styles.stateTitle}>Select a report</h3>
          <p className={styles.stateMessage}>Choose a statistics category from the tabs above.</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.emptyState}>
          <span className={styles.stateIcon}>📊</span>
          <h3 className={styles.stateTitle}>No data available</h3>
          <p className={styles.stateMessage}>
            Statistics for "{report.title}" are not available for the selected season.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>{report.icon}</span>
          {report.title}
        </h2>
        <div className={styles.count}>
          <strong>{data.length}</strong> {data.length === 1 ? 'record' : 'records'}
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width }}
                  title={col.title || col.label}
                  className={col.highlight ? styles.highlightColumn : ''}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rank = (row.no as number) || index + 1;
              const badge = getRankBadge(rank);
              
              return (
                <tr 
                  key={index} 
                  className={rank <= 3 ? styles[`rank${rank}`] : ''}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const formattedValue = formatValue(value, col.key);
                    const isNameColumn = NAME_COLUMNS.includes(col.key);
                    
                    return (
                      <td
                        key={col.key}
                        className={`
                          ${col.highlight ? styles.highlightColumn : ''}
                          ${isNameColumn ? styles.playerName : ''}
                          ${col.key === 'no' ? styles.rankCell : ''}
                        `}
                      >
                        {col.key === 'no' && badge ? (
                          <span className={styles.rankBadge}>{badge}</span>
                        ) : isNameColumn ? (
                          <span className={styles.playerLink}>{formattedValue}</span>
                        ) : (
                          formattedValue
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
