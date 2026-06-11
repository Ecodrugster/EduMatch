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

// MemberService provides business logic for project members.
type MemberService struct {
    repo    repository.MemberRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

func NewMemberService(repo repository.MemberRepo, cfg *config.Config, redisClient *redis.Client) *MemberService {
    return &MemberService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

// Add adds a user as a member to a project.
func (s *MemberService) Add(ctx context.Context, m *domain.Member) error {
    if err := s.validate.Struct(m); err != nil {return err}
    m.JoinedAt = time.Now().UTC().Format(time.RFC3339)
    return s.repo.Add(ctx, m)
}

// ListByProject lists members of a project.
func (s *MemberService) ListByProject(ctx context.Context, projectID int64) ([]*domain.Member, error) {
    return s.repo.ListByProject(ctx, projectID)
}
