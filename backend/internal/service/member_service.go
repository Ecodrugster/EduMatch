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

type MemberService struct {
    repo    repository.MemberRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

func NewMemberService(repo repository.MemberRepo, cfg *config.Config, redisClient *redis.Client) *MemberService {
    return &MemberService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

func (s *MemberService) Add(ctx context.Context, m *domain.Member) error {
    if err := s.validate.Struct(m); err != nil {return err}
    m.JoinedAt = time.Now().UTC()
    return s.repo.Add(ctx, m)
}

func (s *MemberService) ListByProject(ctx context.Context, projectID int64) ([]*domain.Member, error) {
    return s.repo.ListByProject(ctx, projectID)
}

func (s *MemberService) IsMember(ctx context.Context, projectID, userID int64) (bool, error) {
    return s.repo.IsMember(ctx, projectID, userID)
}
