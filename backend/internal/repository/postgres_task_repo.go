package repository

import (
    "context"
    "time"
    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresTaskRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresTaskRepo(pool *pgxpool.Pool) TaskRepo {
    return &postgresTaskRepo{pool: pool}
}

func (r *postgresTaskRepo) Create(ctx context.Context, t *domain.Task) error {
    const q = `
        INSERT INTO tasks (project_id, title, description, status, assigned_to, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    `
    now := time.Now().UTC()
    t.CreatedAt = now
    t.UpdatedAt = now
    if t.Status == "" {
        t.Status = "TODO"
    }

    err := r.pool.QueryRow(ctx, q, t.ProjectID, t.Title, t.Description, t.Status, t.AssignedTo, t.CreatedAt, t.UpdatedAt).Scan(&t.ID)
    return err
}

func (r *postgresTaskRepo) ListByProject(ctx context.Context, projectID int64) ([]*domain.Task, error) {
    const q = `
        SELECT id, project_id, title, description, status, assigned_to, created_at, updated_at, deleted_at
        FROM tasks
        WHERE project_id = $1 AND deleted_at IS NULL
        ORDER BY created_at ASC;
    `
    rows, err := r.pool.Query(ctx, q, projectID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var tasks []*domain.Task
    for rows.Next() {
        var t domain.Task
        if err := rows.Scan(&t.ID, &t.ProjectID, &t.Title, &t.Description, &t.Status, &t.AssignedTo, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt); err != nil {
            return nil, err
        }
        tasks = append(tasks, &t)
    }
    return tasks, nil
}

func (r *postgresTaskRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
    const q = `UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3 AND deleted_at IS NULL;`
    _, err := r.pool.Exec(ctx, q, status, time.Now().UTC(), id)
    return err
}

func (r *postgresTaskRepo) Update(ctx context.Context, t *domain.Task) error {
    const q = `
        UPDATE tasks SET title = $1, description = $2, status = $3, assigned_to = $4, updated_at = $5
        WHERE id = $6 AND deleted_at IS NULL;
    `
    t.UpdatedAt = time.Now().UTC()
    _, err := r.pool.Exec(ctx, q, t.Title, t.Description, t.Status, t.AssignedTo, t.UpdatedAt, t.ID)
    return err
}

func (r *postgresTaskRepo) Delete(ctx context.Context, id int64) error {
    const q = `UPDATE tasks SET deleted_at = $1 WHERE id = $2;`
    _, err := r.pool.Exec(ctx, q, time.Now().UTC(), id)
    return err
}

func (r *postgresTaskRepo) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
    const q = `
        SELECT id, project_id, title, description, status, assigned_to, created_at, updated_at, deleted_at
        FROM tasks
        WHERE id = $1 AND deleted_at IS NULL;
    `
    var t domain.Task
    err := r.pool.QueryRow(ctx, q, id).Scan(&t.ID, &t.ProjectID, &t.Title, &t.Description, &t.Status, &t.AssignedTo, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt)
    if err != nil {
        return nil, err
    }
    return &t, nil
}
