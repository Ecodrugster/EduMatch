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

// ProjectService provides business logic for projects.
type ProjectService struct {
    repo    repository.ProjectRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

func NewProjectService(repo repository.ProjectRepo, cfg *config.Config, redisClient *redis.Client) *ProjectService {
    return &ProjectService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

// Create creates a new project.
func (s *ProjectService) Create(ctx context.Context, p *domain.Project) error {
    if err := s.validate.Struct(p); err != nil {
        return err
    }
    // set timestamps
    now := time.Now().Format(time.RFC3339)
    p.CreatedAt = now
    p.UpdatedAt = now
    p.IsOpen = true
    return s.repo.Create(ctx, p)
}

// Get returns a project by ID.
func (s *ProjectService) Get(ctx context.Context, id int64) (*domain.Project, error) {
    return s.repo.GetByID(ctx, id)
}

// Update updates mutable fields of a project.
func (s *ProjectService) Update(ctx context.Context, p *domain.Project) error {
    if err := s.validate.Struct(p); err != nil {
        return err
    }
    p.UpdatedAt = time.Now().Format(time.RFC3339)
    return s.repo.Update(ctx, p)
}

// Delete performs a soft delete.
func (s *ProjectService) Delete(ctx context.Context, id int64) error {
    return s.repo.Delete(ctx, id)
}

// List returns projects matching filter.
func (s *ProjectService) List(ctx context.Context, filter repository.ProjectFilter) ([]*domain.Project, error) {
    return s.repo.List(ctx, filter)
}
