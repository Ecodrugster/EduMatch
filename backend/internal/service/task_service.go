package service

import (
    "context"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
)

type TaskService struct {
    repo repository.TaskRepo
}

func NewTaskService(repo repository.TaskRepo) *TaskService {
    return &TaskService{repo: repo}
}

func (s *TaskService) Create(ctx context.Context, t *domain.Task) error {
    return s.repo.Create(ctx, t)
}

func (s *TaskService) ListByProject(ctx context.Context, projectID int64) ([]*domain.Task, error) {
    return s.repo.ListByProject(ctx, projectID)
}

func (s *TaskService) UpdateStatus(ctx context.Context, id int64, status string) error {
    return s.repo.UpdateStatus(ctx, id, status)
}

func (s *TaskService) Update(ctx context.Context, t *domain.Task) error {
    return s.repo.Update(ctx, t)
}

func (s *TaskService) Delete(ctx context.Context, id int64) error {
    return s.repo.Delete(ctx, id)
}

func (s *TaskService) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
    return s.repo.GetByID(ctx, id)
}
