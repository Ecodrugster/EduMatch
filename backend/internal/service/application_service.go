package service

import (
    "context"
    "time"

    "github.com/go-playground/validator/v10"
    "github.com/redis/go-redis/v9"

    "edumatch/config"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
)

type ApplicationService struct {
    repo    repository.ApplicationRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

func NewApplicationService(repo repository.ApplicationRepo, cfg *config.Config, redisClient *redis.Client) *ApplicationService {
    return &ApplicationService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

func (s *ApplicationService) Create(ctx context.Context, a *domain.Application) error {
    if err := s.validate.Struct(a); err != nil {return err}
    a.CreatedAt = time.Now().UTC()
    a.Status = "pending"
    return s.repo.Create(ctx, a)
}

func (s *ApplicationService) Get(ctx context.Context, id int64) (*domain.Application, error) {
    return s.repo.GetByID(ctx, id)
}

func (s *ApplicationService) UpdateStatus(ctx context.Context, id int64, status string) error {
    return s.repo.UpdateStatus(ctx, id, status)
}

func (s *ApplicationService) ListByProject(ctx context.Context, projectID int64) ([]*domain.Application, error) {
    return s.repo.ListByProject(ctx, projectID)
}

func (s *ApplicationService) ListByUser(ctx context.Context, userID int64) ([]*domain.Application, error) {
    return s.repo.ListByUser(ctx, userID)
}
