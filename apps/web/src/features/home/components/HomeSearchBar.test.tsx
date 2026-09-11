import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
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

    expect(screen.getByText(/Search at \/map\?/)).toBeInTheDocument();
    expect(screen.getByText(/aiq=quiet\+studio\+near\+Hongdae/)).toBeInTheDocument();
    expect(screen.getByText(/centerLat=37\.5665/)).toBeInTheDocument();
    expect(screen.getByText(/centerLng=126\.978/)).toBeInTheDocument();
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

    expect(screen.getByText(/Search at \/map\?/)).toBeInTheDocument();
  });
});
