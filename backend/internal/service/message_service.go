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

type MessageService struct {
    repo    repository.MessageRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

func NewMessageService(repo repository.MessageRepo, cfg *config.Config, redisClient *redis.Client) *MessageService {
    return &MessageService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

// Create stores a new message.
func (s *MessageService) Create(ctx context.Context, m *domain.Message) error {
    if err := s.validate.Struct(m); err != nil {return err}
    m.SentAt = time.Now().UTC().Format(time.RFC3339)
    return s.repo.Create(ctx, m)
}

// ListByProject returns messages for a project with pagination.
func (s *MessageService) ListByProject(ctx context.Context, projectID int64, limit, offset int) ([]*domain.Message, error) {
    return s.repo.ListByProject(ctx, projectID, limit, offset)
}
