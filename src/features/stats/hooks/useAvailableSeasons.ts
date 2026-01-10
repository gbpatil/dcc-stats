import { useMemo } from 'react';

/**
 * Hook to get available seasons for selection
 */
export function useAvailableSeasons(startYear: number = 2020): number[] {
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const seasons: number[] = [];
    
    for (let year = currentYear; year >= startYear; year--) {
      seasons.push(year);
    }
    
    return seasons;
  }, [startYear]);
}
