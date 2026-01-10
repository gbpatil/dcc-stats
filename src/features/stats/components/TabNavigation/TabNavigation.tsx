import { useState, useRef, useEffect, useCallback } from 'react';
import type { Report, ReportCategory } from '../../types';
import { 
  getPrimaryReports, 
  getSecondaryReportsByCategory,
  CATEGORY_INFO,
} from '../../services';
import styles from './TabNavigation.module.css';

interface TabNavigationProps {
  activeReport: Report | null;
  onReportChange: (report: Report) => void;
}

export function TabNavigation({ activeReport, onReportChange }: TabNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const primaryReports = getPrimaryReports();
  const secondaryByCategory = getSecondaryReportsByCategory();
  
  // Debug logging
  useEffect(() => {
    console.log('Primary reports:', primaryReports.length);
    console.log('Secondary by category:', secondaryByCategory);
    console.log('Categories:', Object.keys(secondaryByCategory));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Initialize scroll indicators
  useEffect(() => {
    updateScrollIndicators();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollIndicators);
      window.addEventListener('resize', updateScrollIndicators);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollIndicators);
      }
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't initiate drag on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    
    // Only mark as dragged if there's significant movement
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      const container = scrollContainerRef.current;
      if (container) {
        container.style.cursor = 'grab';
      }
    }
  };

  // Scroll buttons
  const scrollByAmount = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const isSecondaryActive = activeReport && !primaryReports.some(r => r.id === activeReport.id);

  const handleTabClick = (report: Report) => {
    // Only handle click if user didn't drag
    if (!hasDragged) {
      onReportChange(report);
    }
    setHasDragged(false);
  };

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSecondarySelect = (report: Report) => {
    onReportChange(report);
    setDropdownOpen(false);
  };

  const categories = Object.entries(secondaryByCategory) as [ReportCategory, Report[]][];

  return (
    <nav className={styles.navigation}>
      <div className={styles.wrapper}>
        {/* Left scroll button */}
        <button 
          className={`${styles.scrollButton} ${styles.scrollLeft} ${showLeftArrow ? styles.active : ''}`}
          onClick={() => scrollByAmount('left')}
          aria-label="Scroll left"
          title="Scroll tabs left"
        >
          <span className={styles.arrowIcon}>◀</span>
        </button>

        {/* Scrollable tabs container */}
        <div 
          ref={scrollContainerRef}
          className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Primary Tabs */}
          {primaryReports.map((report) => (
            <button
              key={report.id}
              className={`${styles.tab} ${activeReport?.id === report.id ? styles.active : ''}`}
              onClick={() => handleTabClick(report)}
              aria-selected={activeReport?.id === report.id}
              role="tab"
              title={report.title}
            >
              <span className={styles.tabIcon}>{report.icon}</span>
              <span className={styles.tabLabel}>{report.title}</span>
            </button>
          ))}
        </div>

        {/* Right scroll button */}
        <button 
          className={`${styles.scrollButton} ${styles.scrollRight} ${showRightArrow ? styles.active : ''}`}
          onClick={() => scrollByAmount('right')}
          aria-label="Scroll right"
          title="Scroll tabs right"
        >
          <span className={styles.arrowIcon}>▶</span>
        </button>

        {/* More Stats Dropdown - Outside scrollable container */}
        <div className={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            className={`${styles.tab} ${styles.dropdownTrigger} ${isSecondaryActive ? styles.active : ''} ${dropdownOpen ? styles.open : ''}`}
            onClick={handleDropdownToggle}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className={styles.tabIcon}>📋</span>
            <span className={styles.tabLabel}>
              {isSecondaryActive && activeReport ? activeReport.title : 'More Stats'}
            </span>
            <span className={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {categories.length === 0 ? (
                <div className={styles.dropdownEmpty}>No additional stats available</div>
              ) : (
                categories.map(([category, reports]) => (
                  <DropdownSection
                    key={category}
                    title={`${CATEGORY_INFO[category]?.icon || '📊'} ${CATEGORY_INFO[category]?.label || category}`}
                    reports={reports}
                    activeReport={activeReport}
                    onSelect={handleSecondarySelect}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Sub-component for dropdown sections
interface DropdownSectionProps {
  title: string;
  reports: Report[];
  activeReport: Report | null;
  onSelect: (report: Report) => void;
}

function DropdownSection({ title, reports, activeReport, onSelect }: DropdownSectionProps) {
  return (
    <div className={styles.dropdownSection}>
      <div className={styles.dropdownSectionTitle}>{title}</div>
      {reports.map((report) => (
        <button
          key={report.id}
          className={`${styles.dropdownItem} ${activeReport?.id === report.id ? styles.active : ''}`}
          onClick={() => onSelect(report)}
          title={report.title}
        >
          <span className={styles.dropdownItemIcon}>{report.icon}</span>
          <span className={styles.dropdownItemLabel}>{report.title}</span>
        </button>
      ))}
    </div>
  );
}
