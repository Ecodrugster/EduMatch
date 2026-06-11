package repository

import (
    "context"
    "fmt"
    "time"

    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresProjectRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresProjectRepo(pool *pgxpool.Pool) ProjectRepo {
    return &postgresProjectRepo{pool: pool}
}

func (r *postgresProjectRepo) Create(ctx context.Context, p *domain.Project) error {
    const q = `
        INSERT INTO projects (owner_id, title, description, skills_required, is_open, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at, updated_at;
    `
    now := time.Now().UTC()
    err := r.pool.QueryRow(ctx, q,
        p.OwnerID,
        p.Title,
        p.Description,
        p.SkillsRequired,
        p.IsOpen,
        now,
        now,
    ).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
    return err
}

func (r *postgresProjectRepo) GetByID(ctx context.Context, id int64) (*domain.Project, error) {
    const q = `
        SELECT id, owner_id, title, description, skills_required, is_open, created_at, updated_at, deleted_at
        FROM projects WHERE id = $1 AND deleted_at IS NULL;
    `
    var p domain.Project
    err := r.pool.QueryRow(ctx, q, id).Scan(
        &p.ID, &p.OwnerID, &p.Title, &p.Description,
        &p.SkillsRequired, &p.IsOpen,
        &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
    )
    if err != nil {
        return nil, err
    }
    return &p, nil
}

func (r *postgresProjectRepo) Update(ctx context.Context, p *domain.Project) error {
    const q = `
        UPDATE projects SET title = $1, description = $2, skills_required = $3, is_open = $4, updated_at = $5
        WHERE id = $6 AND deleted_at IS NULL;
    `
    _, err := r.pool.Exec(ctx, q, p.Title, p.Description, p.SkillsRequired, p.IsOpen, time.Now().UTC(), p.ID)
    return err
}

func (r *postgresProjectRepo) Delete(ctx context.Context, id int64) error {
    const q = `UPDATE projects SET deleted_at = $1 WHERE id = $2;`
    _, err := r.pool.Exec(ctx, q, time.Now().UTC(), id)
    return err
}

func (r *postgresProjectRepo) List(ctx context.Context, filter ProjectFilter) ([]*domain.Project, error) {
    // Build dynamic query based on filter fields
    base := `SELECT id, owner_id, title, description, skills_required, is_open, created_at, updated_at FROM projects WHERE deleted_at IS NULL`
    args := []any{}
    idx := 1
    if filter.TitleContains != "" {
        base += fmt.Sprintf(" AND title ILIKE $%d", idx)
        args = append(args, "%"+filter.TitleContains+"%")
        idx++
    }
    if filter.OwnerID != 0 {
        base += fmt.Sprintf(" AND owner_id = $%d", idx)
        args = append(args, filter.OwnerID)
        idx++
    }
    if filter.OpenOnly {
        base += fmt.Sprintf(" AND is_open = true")
    }
    // Skills filter – simple overlap using && operator for PostgreSQL arrays
    if len(filter.Skills) > 0 {
        base += fmt.Sprintf(" AND skills_required && $%d", idx)
        args = append(args, filter.Skills)
        idx++
    }
    rows, err := r.pool.Query(ctx, base, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var results []*domain.Project
    for rows.Next() {
        var p domain.Project
        if err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.SkillsRequired, &p.IsOpen, &p.CreatedAt, &p.UpdatedAt); err != nil {
            return nil, err
        }
        results = append(results, &p)
    }
    return results, nil
}
