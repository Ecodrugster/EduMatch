package repository

import (
    "context"
    "errors"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
    "edumatch/internal/domain"
)

type postgresUserRepo struct {
    pool *pgxpool.Pool
}

// NewPostgresUserRepo creates a UserRepo backed by PostgreSQL.
func NewPostgresUserRepo(pool *pgxpool.Pool) UserRepo {
    return &postgresUserRepo{pool: pool}
}

func (r *postgresUserRepo) Create(ctx context.Context, u *domain.User) error {
    if u == nil {
        return errors.New("user is nil")
    }
    query := `INSERT INTO users (username, email, password_hash, skills, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, created_at, updated_at`
    // pgx can scan into []string directly
    err := r.pool.QueryRow(ctx, query, u.Username, u.Email, u.Password, u.Skills, u.Bio).
        Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
    if err != nil {
        return err
    }
    return nil
}

func (r *postgresUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
    query := `SELECT id, username, email, password_hash, skills, bio, created_at, updated_at, deleted_at
        FROM users WHERE email=$1 AND deleted_at IS NULL`
    var u domain.User
    var deletedAt *time.Time
    err := r.pool.QueryRow(ctx, query, email).Scan(
        &u.ID, &u.Username, &u.Email, &u.Password, &u.Skills, &u.Bio, &u.CreatedAt, &u.UpdatedAt, &deletedAt,
    )
    if err != nil {
        return nil, err
    }
    u.DeletedAt = deletedAt
    return &u, nil
}

func (r *postgresUserRepo) GetByID(ctx context.Context, id int64) (*domain.User, error) {
    query := `SELECT id, username, email, password_hash, skills, bio, created_at, updated_at, deleted_at
        FROM users WHERE id=$1 AND deleted_at IS NULL`
    var u domain.User
    var deletedAt *time.Time
    err := r.pool.QueryRow(ctx, query, id).Scan(
        &u.ID, &u.Username, &u.Email, &u.Password, &u.Skills, &u.Bio, &u.CreatedAt, &u.UpdatedAt, &deletedAt,
    )
    if err != nil {
        return nil, err
    }
    u.DeletedAt = deletedAt
    return &u, nil
}

func (r *postgresUserRepo) Delete(ctx context.Context, id int64) error {
    query := `UPDATE users SET deleted_at = NOW() WHERE id=$1 AND deleted_at IS NULL`
    cmdTag, err := r.pool.Exec(ctx, query, id)
    if err != nil {
        return err
    }
    if cmdTag.RowsAffected() == 0 {
        return errors.New("no rows updated")
    }
    return nil
}
