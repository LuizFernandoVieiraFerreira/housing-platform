package profile

import (
	"context"

	"github.com/jackc/pgx/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetProfile(ctx context.Context, user *auth.User) (Profile, error) {
	profileID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return Profile{}, err
	}

	var result Profile
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		row, err := s.repo.GetByID(ctx, tx, profileID)
		if err != nil {
			return err
		}
		if row == nil {
			panic(apierrors.NotFound("Profile not found"))
		}
		result = mapProfile(*row)
		return nil
	})
	return result, err
}

func (s *Service) UpdateProfile(ctx context.Context, user *auth.User, req UpdateProfileRequest) (Profile, error) {
	profileID, err := shared.ParseUUID(user.ID)
	if err != nil {
		return Profile{}, err
	}

	var result Profile
	err = shared.WithTx(ctx, s.repo.pool, func(tx pgx.Tx) error {
		row, err := s.repo.Update(ctx, tx, profileID, req)
		if err != nil {
			return err
		}
		if row == nil {
			panic(apierrors.NotFound("Profile not found"))
		}
		result = mapProfile(*row)
		return nil
	})
	return result, err
}
