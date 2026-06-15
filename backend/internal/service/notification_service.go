package service

import (
    "context"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
)

type NotificationService struct {
    repo repository.NotificationRepo
}

func NewNotificationService(repo repository.NotificationRepo) *NotificationService {
    return &NotificationService{repo: repo}
}

func (s *NotificationService) Create(ctx context.Context, n *domain.Notification) error {
    return s.repo.Create(ctx, n)
}

func (s *NotificationService) ListByUser(ctx context.Context, userID int64) ([]*domain.Notification, error) {
    return s.repo.ListByUser(ctx, userID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, id int64) error {
    return s.repo.MarkAsRead(ctx, id)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID int64) error {
    return s.repo.MarkAllAsRead(ctx, userID)
}
