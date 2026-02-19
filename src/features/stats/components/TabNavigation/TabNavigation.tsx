import { useState, useRef, useEffect, useCallback } from 'react';
import type { Report, ReportCategory } from '../../types';
import {
  getAllReportsByCategory,
  CATEGORY_INFO,
} from '../../services';
import styles from './TabNavigation.module.css';

interface TabNavigationProps {
  activeReport: Report | null;
  onReportChange: (report: Report) => void;
}

// Custom hook to detect mobile viewport
function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);
  
  return isMobile;
}

export function TabNavigation({ activeReport, onReportChange }: TabNavigationProps) {
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection
  const isMobile = useIsMobile(768);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Two-level navigation: all reports grouped by category
  const allByCategory = getAllReportsByCategory();
  const categoryEntries = Object.entries(allByCategory) as [ReportCategory, Report[]][];

  // Derive active category from active report (no separate state needed since
  // tapping a category chip auto-selects the first report in that category)
  const activeCategory = activeReport?.category || 'batting';
  const filteredReports = allByCategory[activeCategory] || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileDropdownOpen(false);
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

  const handleTabClick = (report: Report) => {
    // Only handle click if user didn't drag
    if (!hasDragged) {
      onReportChange(report);
    }
    setHasDragged(false);
  };

  const handleMobileSelect = (report: Report) => {
    onReportChange(report);
    setMobileDropdownOpen(false);
  };

  const handleCategoryChange = (category: ReportCategory) => {
    // Auto-select the first report in the new category
    const reportsInCategory = allByCategory[category];
    if (reportsInCategory && reportsInCategory.length > 0) {
      onReportChange(reportsInCategory[0]);
    }
    setMobileDropdownOpen(false);
  };

  // Mobile view: Two-level category navigation
  if (isMobile) {
    return (
      <nav className={styles.navigation}>
        <div className={styles.mobileNavWrapper}>
          {/* Level 1: Category chips - horizontally scrollable */}
          <div className={styles.categoryChipsContainer}>
            <div className={styles.categoryChipsScroll}>
              {categoryEntries.map(([category]) => (
                <button
                  key={category}
                  className={`${styles.categoryChip} ${
                    activeCategory === category ? styles.categoryChipActive : ''
                  }`}
                  onClick={() => handleCategoryChange(category)}
                  aria-pressed={activeCategory === category}
                >
                  <span className={styles.categoryChipIcon}>
                    {CATEGORY_INFO[category]?.icon || '📊'}
                  </span>
                  <span className={styles.categoryChipLabel}>
                    {CATEGORY_INFO[category]?.label || category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Level 2: Filtered report dropdown */}
          <div className={styles.mobileDropdownWrapper} ref={mobileDropdownRef}>
            <button
              className={`${styles.mobileDropdownTrigger} ${mobileDropdownOpen ? styles.open : ''}`}
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              aria-expanded={mobileDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className={styles.mobileDropdownIcon}>
                {activeReport?.icon || '📊'}
              </span>
              <span className={styles.mobileDropdownLabel}>
                {activeReport?.title || 'Select Stats'}
              </span>
              <span className={styles.mobileDropdownArrow}>
                {mobileDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {mobileDropdownOpen && (
              <div className={styles.mobileDropdownMenu}>
                {filteredReports.length === 0 ? (
                  <div className={styles.mobileDropdownEmpty}>
                    No stats available in this category
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <button
                      key={report.id}
                      className={`${styles.mobileDropdownItem} ${
                        activeReport?.id === report.id ? styles.active : ''
                      }`}
                      onClick={() => handleMobileSelect(report)}
                      title={report.title}
                    >
                      <span className={styles.mobileDropdownItemIcon}>
                        {report.icon}
                      </span>
                      <span className={styles.mobileDropdownItemLabel}>
                        {report.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Desktop view: Category chips + filtered report tabs
  return (
    <nav className={styles.navigation}>
      <div className={styles.desktopNavWrapper}>
        {/* Level 1: Category chips */}
        <div className={styles.desktopCategoryChips}>
          {categoryEntries.map(([category]) => (
            <button
              key={category}
              className={`${styles.categoryChip} ${styles.desktopChip} ${
                activeCategory === category ? styles.categoryChipActive : ''
              }`}
              onClick={() => handleCategoryChange(category)}
              aria-pressed={activeCategory === category}
            >
              <span className={styles.categoryChipIcon}>
                {CATEGORY_INFO[category]?.icon || '📊'}
              </span>
              <span className={styles.categoryChipLabel}>
                {CATEGORY_INFO[category]?.label || category}
              </span>
            </button>
          ))}
        </div>

        {/* Level 2: Filtered report tabs with scroll */}
        <div className={styles.wrapper}>
          <button
            className={`${styles.scrollButton} ${styles.scrollLeft} ${showLeftArrow ? styles.active : ''}`}
            onClick={() => scrollByAmount('left')}
            aria-label="Scroll left"
            title="Scroll tabs left"
          >
            <span className={styles.arrowIcon}>◀</span>
          </button>

          <div
            ref={scrollContainerRef}
            className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {filteredReports.map((report) => (
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

          <button
            className={`${styles.scrollButton} ${styles.scrollRight} ${showRightArrow ? styles.active : ''}`}
            onClick={() => scrollByAmount('right')}
            aria-label="Scroll right"
            title="Scroll tabs right"
          >
            <span className={styles.arrowIcon}>▶</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
