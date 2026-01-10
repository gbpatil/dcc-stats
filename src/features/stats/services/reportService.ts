import type { Report, ReportCategory, ReportLinksData } from '../types';
import reportLinksData from '@/api/report_links.json';

// ============================================
// Report Service - Manages report links and data fetching
// ============================================

// Number of primary reports to show as tabs
const PRIMARY_REPORT_COUNT = 13;

// Icon mappings based on report title keywords
const ICON_MAPPINGS: Record<string, string> = {
  'run': '🏏',
  'batting': '🏏',
  'score': '💯',
  'average': '📊',
  'strike rate': '⚡',
  'wicket': '⚾',
  'bowling': '🎯',
  'catch': '🧤',
  'stumping': '🧤',
  'fielding': '🧤',
  'partnership': '🤝',
  'all-rounder': '⭐',
  'match': '🎮',
  'win': '🏆',
  'duck': '🦆',
  'hundred': '💯',
  'century': '💯',
  'fifty': '5️⃣0️⃣',
  'six': '6️⃣',
  'four': '4️⃣',
  'boundary': '4️⃣',
  'hat trick': '🎩',
  'maiden': '🚫',
  'economy': '💰',
  'run out': '🏃',
  'debut': '🌟',
  'season': '📅',
  'total': '📈',
  'margin': '📏',
  'consecutive': '🔗',
  'umpire': '👨‍⚖️',
  'scorer': '📝',
  'captain': '👑',
  'mvp': '🏅',
  'ranking': '📋',
  'recent': '🕐',
  'upcoming': '📆',
};

// Category mappings based on report title keywords
const CATEGORY_MAPPINGS: Array<{ keywords: string[]; category: ReportCategory }> = [
  { keywords: ['batting', 'run', 'score', 'hundred', 'century', 'fifty', 'duck', 'six', 'four', 'boundary', 'balls faced', 'carrying the bat'], category: 'batting' },
  { keywords: ['bowling', 'wicket', 'economy', 'maiden', 'hat trick', 'wides', 'noballs'], category: 'bowling' },
  { keywords: ['catch', 'stumping', 'fielding', 'keeping', 'run out', 'dismissal'], category: 'fielding' },
  { keywords: ['partnership'], category: 'partnerships' },
  { keywords: ['match', 'win', 'loss', 'captain', 'mvp', 'ranking', 'debut', 'serving', 'played together'], category: 'player' },
  { keywords: ['innings total', 'team', 'margin', 'chase', 'extras', 'consecutive matches', 'toss'], category: 'team' },
  { keywords: ['most', 'top', 'highest', 'lowest', 'best'], category: 'milestones' },
];

/**
 * Get icon for a report based on its title
 */
function getIconForReport(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  for (const [keyword, icon] of Object.entries(ICON_MAPPINGS)) {
    if (lowerTitle.includes(keyword)) {
      return icon;
    }
  }
  
  return '📊'; // Default icon
}

/**
 * Get category for a report based on its title
 */
function getCategoryForReport(title: string): ReportCategory {
  const lowerTitle = title.toLowerCase();
  
  for (const mapping of CATEGORY_MAPPINGS) {
    if (mapping.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return mapping.category;
    }
  }
  
  return 'other';
}

/**
 * Generate a unique ID from report title
 */
function generateReportId(title: string, index: number): string {
  return `report-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
}

/**
 * Process raw report links into enriched Report objects
 */
function processReportLinks(data: ReportLinksData): Report[] {
  // Remove duplicates based on URL
  const seenUrls = new Set<string>();
  const uniqueLinks = data.links.filter(link => {
    if (seenUrls.has(link.url)) {
      return false;
    }
    seenUrls.add(link.url);
    return true;
  });

  return uniqueLinks.map((link, index) => ({
    id: generateReportId(link.title, index),
    title: link.title,
    url: link.url,
    icon: getIconForReport(link.title),
    category: getCategoryForReport(link.title),
  }));
}

// Process all reports
const allReports = processReportLinks(reportLinksData as ReportLinksData);

/**
 * Get primary reports (shown as tabs)
 */
export function getPrimaryReports(): Report[] {
  return allReports.slice(0, PRIMARY_REPORT_COUNT);
}

/**
 * Get secondary reports (shown in dropdown)
 */
export function getSecondaryReports(): Report[] {
  return allReports.slice(PRIMARY_REPORT_COUNT);
}

/**
 * Get secondary reports grouped by category
 */
export function getSecondaryReportsByCategory(): Record<ReportCategory, Report[]> {
  const secondary = getSecondaryReports();
  const grouped: Record<ReportCategory, Report[]> = {
    batting: [],
    bowling: [],
    fielding: [],
    partnerships: [],
    player: [],
    team: [],
    milestones: [],
    other: [],
  };

  secondary.forEach(report => {
    grouped[report.category].push(report);
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, reports]) => reports.length > 0)
  ) as Record<ReportCategory, Report[]>;
}

/**
 * Get a report by ID
 */
export function getReportById(id: string): Report | undefined {
  return allReports.find(report => report.id === id);
}

/**
 * Get all reports
 */
export function getAllReports(): Report[] {
  return allReports;
}

/**
 * Fetch stats data from a report URL
 */
export async function fetchReportData<T = unknown>(url: string, season?: number): Promise<T[]> {
  // Replace season in URL if provided
  let fetchUrl = url;
  if (season) {
    fetchUrl = url.replace(/season=\d+/, `season=${season}`);
  }

  // In development, use Vite proxy (relative URL)
  // In production, use CORS proxy to bypass CORS restrictions
  const isDev = import.meta.env.DEV;
  
  let finalUrl: string;
  if (isDev) {
    // Use Vite proxy in development
    finalUrl = fetchUrl.replace('https://www2.cricketstatz.com', '');
  } else {
    // Use CORS proxy in production (GitHub Pages)
    finalUrl = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;
  }
  
  const response = await fetch(finalUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  
  return response.json();
}

// Category display names and icons
export const CATEGORY_INFO: Record<ReportCategory, { label: string; icon: string }> = {
  batting: { label: 'Batting', icon: '🏏' },
  bowling: { label: 'Bowling', icon: '🎯' },
  fielding: { label: 'Fielding', icon: '🧤' },
  partnerships: { label: 'Partnerships', icon: '🤝' },
  player: { label: 'Player Stats', icon: '👤' },
  team: { label: 'Team Stats', icon: '👥' },
  milestones: { label: 'Milestones', icon: '🏆' },
  other: { label: 'Other', icon: '📊' },
};
