package repository

import (
    "context"
    "time"

    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresApplicationRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresApplicationRepo(pool *pgxpool.Pool) ApplicationRepo {
    return &postgresApplicationRepo{pool: pool}
}

func (r *postgresApplicationRepo) Create(ctx context.Context, a *domain.Application) error {
    const q = `
        INSERT INTO applications (project_id, user_id, message, status, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at;
    `
    a.CreatedAt = time.Now().UTC()
    err := r.pool.QueryRow(ctx, q, a.ProjectID, a.UserID, a.Message, a.Status, a.CreatedAt).Scan(&a.ID, &a.CreatedAt)
    if err != nil {
        return err
    }
    return nil
}

func (r *postgresApplicationRepo) GetByID(ctx context.Context, id int64) (*domain.Application, error) {
    const q = `
        SELECT id, project_id, user_id, message, status, created_at, deleted_at
        FROM applications WHERE id = $1 AND deleted_at IS NULL;
    `
    var a domain.Application
    err := r.pool.QueryRow(ctx, q, id).Scan(&a.ID, &a.ProjectID, &a.UserID, &a.Message, &a.Status, &a.CreatedAt, &a.DeletedAt)
    if err != nil {
        return nil, err
    }
    return &a, nil
}

func (r *postgresApplicationRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
    const q = `UPDATE applications SET status = $1 WHERE id = $2 AND deleted_at IS NULL;`
    _, err := r.pool.Exec(ctx, q, status, id)
    return err
}

func (r *postgresApplicationRepo) ListByProject(ctx context.Context, projectID int64) ([]*domain.Application, error) {
    const q = `
        SELECT id, project_id, user_id, message, status, created_at
        FROM applications WHERE project_id = $1 AND deleted_at IS NULL;
    `
    rows, err := r.pool.Query(ctx, q, projectID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var result []*domain.Application
    for rows.Next() {
        var a domain.Application
        if err := rows.Scan(&a.ID, &a.ProjectID, &a.UserID, &a.Message, &a.Status, &a.CreatedAt); err != nil {
            return nil, err
        }
        result = append(result, &a)
    }
    return result, nil
}

func (r *postgresApplicationRepo) ListByUser(ctx context.Context, userID int64) ([]*domain.Application, error) {
    const q = `
        SELECT id, project_id, user_id, message, status, created_at
        FROM applications WHERE user_id = $1 AND deleted_at IS NULL;
    `
    rows, err := r.pool.Query(ctx, q, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var result []*domain.Application
    for rows.Next() {
        var a domain.Application
        if err := rows.Scan(&a.ID, &a.ProjectID, &a.UserID, &a.Message, &a.Status, &a.CreatedAt); err != nil {
            return nil, err
        }
        result = append(result, &a)
    }
    return result, nil
}
