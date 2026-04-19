import { useEffect } from 'react';

/**
 * Sets the browser tab title for the current page.
 * Usage: usePageTitle('Dashboard') → tab shows "Dashboard | SurveyLabs"
 */
export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | SurveyLabs` : 'SurveyLabs';
    return () => { document.title = prev; };
  }, [title]);
}
