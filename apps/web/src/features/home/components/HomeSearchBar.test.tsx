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
  it('navigates to map search with AI query and filter params', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomeSearchBar />} />
        <Route path="/map" element={<SearchResultsPage />} />
      </Routes>,
    );

    await user.type(screen.getByLabelText('Smart property search'), 'quiet studio near Hongdae');
    await user.type(screen.getByLabelText('Check in'), '2026-09-01');
    await user.type(screen.getByLabelText('Check out'), '2026-10-01');
    await user.clear(screen.getByLabelText('Guests'));
    await user.type(screen.getByLabelText('Guests'), '2');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByText(/Search at \/map\?/)).toBeInTheDocument();
    expect(screen.getByText(/aiq=quiet\+studio\+near\+Hongdae/)).toBeInTheDocument();
    expect(screen.getByText(/checkIn=2026-09-01/)).toBeInTheDocument();
    expect(screen.getByText(/checkOut=2026-10-01/)).toBeInTheDocument();
    expect(screen.getByText(/guests=2/)).toBeInTheDocument();
    expect(screen.getByText(/centerLat=37\.5665/)).toBeInTheDocument();
    expect(screen.getByText(/centerLng=126\.978/)).toBeInTheDocument();
  });
});
