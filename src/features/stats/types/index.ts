// ============================================
// Stats Feature - Type Definitions
// ============================================

// Report Link from JSON
export interface ReportLink {
  title: string;
  url: string;
}

// Report Links Data
export interface ReportLinksData {
  count: number;
  links: ReportLink[];
}

// Processed Report with metadata
export interface Report {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: ReportCategory;
}

// Report Categories for dropdown grouping
export type ReportCategory = 
  | 'batting'
  | 'bowling'
  | 'fielding'
  | 'partnerships'
  | 'player'
  | 'team'
  | 'milestones'
  | 'other';

// Column Configuration for Tables
export interface ColumnConfig {
  key: string;
  label: string;
  width: string;
  title?: string;
  highlight?: boolean;
}

// Generic stats data row
export type StatsRow = Record<string, unknown>;
