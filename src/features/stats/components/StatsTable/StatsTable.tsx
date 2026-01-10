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

// Columns that should be highlighted (important stats)
const HIGHLIGHT_COLUMNS = ['runs', 'wkts', 'avg', 'total', 'score', 'points', 'catches', 'hs', 'bb', 'sr', 'econ'];

// Columns that contain player names
const NAME_COLUMNS = ['name', 'bat1', 'bat2', 'player'];

// Priority columns that should appear first (in order)
const PRIORITY_ORDER = ['no', 'name', 'player', 'bat1', 'bat2'];

// Order for highlighted columns (most important first, HS after Runs and Avg)
const HIGHLIGHT_ORDER = [
  'runs',      // Batting: Total runs first
  'score',     // Individual score
  'total',     // Total
  'avg',       // Average
  'hs',        // Highest score (after runs and avg)
  'sr',        // Strike rate
  'wkts',      // Bowling: Wickets
  'bb',        // Best bowling (after wkts)
  'econ',      // Economy rate
  'catches',   // Fielding
  'points',    // Points
];

/**
 * Get column width based on key type
 */
function getColumnWidth(key: string): string {
  if (key === 'no') return '50px';
  if (key === 'name' || key === 'player') return '160px';
  if (key === 'bat1' || key === 'bat2') return '150px';
  if (key === 'last_team' || key === 'team') return '130px';
  if (key === 'opposition') return '160px';
  if (key === 'venue') return '150px';
  if (key === 'date') return '100px';
  if (key === 'season') return '80px';
  if (['mts', 'inns', 'nos', '4s', '6s', '100s', '50s', '0s', '5w', '4w', 'wkt'].includes(key)) return '55px';
  if (['avg', 'sr', 'econ', 'bat_avg', 'bowl_avg'].includes(key)) return '70px';
  if (['runs', 'wkts', 'balls', 'overs', 'catches', 'stumpings', 'runouts'].includes(key)) return '65px';
  if (key === 'hs' || key === 'bb') return '75px';
  if (key === 'score' || key === 'total' || key === 'points') return '80px';
  return '70px';
}

/**
 * Auto-detect and reorder columns from data
 * Order: Rank -> Name columns -> Highlighted columns -> Other columns
 */
function detectColumns(data: StatsRow[]): ColumnConfig[] {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  
  // Create column configs
  const allColumns = keys.map(key => {
    const labelInfo = COLUMN_LABELS[key] || { label: formatColumnKey(key) };
    const isHighlight = HIGHLIGHT_COLUMNS.includes(key);
    
    return {
      key,
      label: labelInfo.label,
      title: labelInfo.title,
      width: getColumnWidth(key),
      highlight: isHighlight,
    };
  });

  // Separate columns into groups
  const priorityColumns: ColumnConfig[] = [];
  const highlightColumns: ColumnConfig[] = [];
  const otherColumns: ColumnConfig[] = [];

  // Sort columns into groups
  allColumns.forEach(col => {
    if (PRIORITY_ORDER.includes(col.key)) {
      priorityColumns.push(col);
    } else if (col.highlight) {
      highlightColumns.push(col);
    } else {
      otherColumns.push(col);
    }
  });

  // Sort priority columns by their defined order
  priorityColumns.sort((a, b) => {
    return PRIORITY_ORDER.indexOf(a.key) - PRIORITY_ORDER.indexOf(b.key);
  });

  // Sort highlighted columns by their defined order (Runs before HS, etc.)
  highlightColumns.sort((a, b) => {
    const indexA = HIGHLIGHT_ORDER.indexOf(a.key);
    const indexB = HIGHLIGHT_ORDER.indexOf(b.key);
    // If not in order list, put at end
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  // Return reordered columns: Priority -> Highlighted -> Others
  return [...priorityColumns, ...highlightColumns, ...otherColumns];
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
