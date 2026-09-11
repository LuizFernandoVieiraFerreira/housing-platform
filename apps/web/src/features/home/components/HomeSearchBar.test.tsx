import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { expectMapHrefContract } from '@/test/map-link-contract';
import { renderWithProviders } from '@/test/render';

function SearchResultsPage() {
  const location = useLocation();

  return (
    <p>
      Search at {location.pathname}
      {location.search}
    </p>
  );
}

describe('HomeSearchBar', () => {
  function renderSearchBar() {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomeSearchBar />} />
        <Route path="/map" element={<SearchResultsPage />} />
      </Routes>,
    );
  }

  it('navigates to map search with the AI query and Seoul centre', async () => {
    const user = userEvent.setup();

    renderSearchBar();

    await user.type(screen.getByLabelText('Smart property search'), 'quiet studio near Hongdae');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const searchSummary = screen.getByText(/Search at \/map\?/);
    const href = searchSummary.textContent?.replace('Search at ', '') ?? '';
    const { ai, filters } = expectMapHrefContract(href);

    expect(ai.aiQuery).toBe('quiet studio near Hongdae');
    expect(filters.centerLat).toBe(37.5665);
    expect(filters.centerLng).toBe(126.978);
  });

  it('only asks for the query, leaving dates and guests to the map filters', () => {
    renderSearchBar();

    expect(screen.queryByLabelText('Check in')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Check out')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Guests')).not.toBeInTheDocument();
  });

  it('still reaches the map when submitted empty', async () => {
    const user = userEvent.setup();

    renderSearchBar();

    await user.click(screen.getByRole('button', { name: 'Search' }));

    const searchSummary = screen.getByText(/Search at \/map\?/);
    const href = searchSummary.textContent?.replace('Search at ', '') ?? '';
    expectMapHrefContract(href);
  });
});
