package service

import (
    "context"
    "errors"
    "testing"
    "time"

    "edumatch/config"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
)

type mockProjectRepo struct {
    store  map[int64]*domain.Project
    nextID int64
}

func newMockProjectRepo() *mockProjectRepo {
    return &mockProjectRepo{store: make(map[int64]*domain.Project), nextID: 1}
}

func (r *mockProjectRepo) Create(ctx context.Context, p *domain.Project) error {
    p.ID = r.nextID
    r.nextID++
    now := time.Now().UTC()
    p.CreatedAt = now
    p.UpdatedAt = now
    r.store[p.ID] = p
    return nil
}

func (r *mockProjectRepo) GetByID(ctx context.Context, id int64) (*domain.Project, error) {
    if p, ok := r.store[id]; ok {
        return p, nil
    }
    return nil, errors.New("not found")
}

func (r *mockProjectRepo) Update(ctx context.Context, p *domain.Project) error {
    if _, ok := r.store[p.ID]; !ok {
        return errors.New("not found")
    }
    p.UpdatedAt = time.Now().UTC()
    r.store[p.ID] = p
    return nil
}

func (r *mockProjectRepo) Delete(ctx context.Context, id int64) error {
    if p, ok := r.store[id]; ok {
        now := time.Now().UTC()
        p.DeletedAt = &now
        return nil
    }
    return errors.New("not found")
}

func (r *mockProjectRepo) List(ctx context.Context, filter repository.ProjectFilter) ([]*domain.Project, error) {
    var out []*domain.Project
    for _, p := range r.store {
        if filter.OwnerID != 0 && p.OwnerID != filter.OwnerID {
            continue
        }
        if filter.OpenOnly && !p.IsOpen {
            continue
        }
        out = append(out, p)
    }
    return out, nil
}

func TestProjectService_CreateGetUpdateDelete(t *testing.T) {
    repo := newMockProjectRepo()
    cfg := &config.Config{AccessTokenTTLMinutes: 15, RefreshExpiryDays: 7}
    svc := NewProjectService(repo, cfg, nil)

    ctx := context.Background()
    proj := &domain.Project{OwnerID: 1, Title: "Test", Description: "Desc", SkillsRequired: []string{"go"}}
    if err := svc.Create(ctx, proj); err != nil {
        t.Fatalf("Create failed: %v", err)
    }
    // Get
    fetched, err := svc.Get(ctx, proj.ID)
    if err != nil {
        t.Fatalf("Get failed: %v", err)
    }
    if fetched.Title != proj.Title {
        t.Fatalf("expected title %s, got %s", proj.Title, fetched.Title)
    }
    // Update
    proj.Title = "Updated"
    if err := svc.Update(ctx, proj); err != nil {
        t.Fatalf("Update failed: %v", err)
    }
    updated, _ := svc.Get(ctx, proj.ID)
    if updated.Title != "Updated" {
        t.Fatalf("title not updated, got %s", updated.Title)
    }
    // Delete (soft)
    if err := svc.Delete(ctx, proj.ID); err != nil {
        t.Fatalf("Delete failed: %v", err)
    }
    // Ensure DeletedAt set
    del, _ := svc.Get(ctx, proj.ID)
    if del.DeletedAt == nil {
        t.Fatalf("DeletedAt not set after delete")
    }
}

func TestProjectService_List(t *testing.T) {
    repo := newMockProjectRepo()
    cfg := &config.Config{AccessTokenTTLMinutes: 15, RefreshExpiryDays: 7}
    svc := NewProjectService(repo, cfg, nil)
    ctx := context.Background()

    svc.Create(ctx, &domain.Project{OwnerID: 1, Title: "P1", IsOpen: true})
    svc.Create(ctx, &domain.Project{OwnerID: 2, Title: "P2", IsOpen: false})
    filter := repository.ProjectFilter{OwnerID: 1, OpenOnly: true}
    list, err := svc.List(ctx, filter)
    if err != nil {
        t.Fatalf("List error: %v", err)
    }
    if len(list) != 1 || list[0].OwnerID != 1 {
        t.Fatalf("unexpected list result: %+v", list)
    }
}
