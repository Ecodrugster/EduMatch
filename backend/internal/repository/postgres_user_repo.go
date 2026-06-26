package repository

import (
    "context"
    "errors"
    "fmt"
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
    query := `INSERT INTO users (username, email, password_hash, skills, bio, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, created_at, updated_at`
    // pgx can scan into []string directly
    err := r.pool.QueryRow(ctx, query, u.Username, u.Email, u.Password, u.Skills, u.Bio, u.AvatarURL).
        Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
    if err != nil {
        return err
    }
    return nil
}

func (r *postgresUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
    query := `SELECT id, username, email, password_hash, skills, bio, avatar_url, created_at, updated_at, deleted_at
        FROM users WHERE email=$1 AND deleted_at IS NULL`
    var u domain.User
    var deletedAt *time.Time
    err := r.pool.QueryRow(ctx, query, email).Scan(
        &u.ID, &u.Username, &u.Email, &u.Password, &u.Skills, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt, &deletedAt,
    )
    if err != nil {
        return nil, err
    }
    u.DeletedAt = deletedAt
    return &u, nil
}

func (r *postgresUserRepo) GetByID(ctx context.Context, id int64) (*domain.User, error) {
    query := `SELECT id, username, email, password_hash, skills, bio, avatar_url, created_at, updated_at, deleted_at
        FROM users WHERE id=$1 AND deleted_at IS NULL`
    var u domain.User
    var deletedAt *time.Time
    err := r.pool.QueryRow(ctx, query, id).Scan(
        &u.ID, &u.Username, &u.Email, &u.Password, &u.Skills, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt, &deletedAt,
    )
    if err != nil {
        return nil, err
    }
    u.DeletedAt = deletedAt
    return &u, nil
}

func (r *postgresUserRepo) UpdateProfile(ctx context.Context, u *domain.User) error {
    if u == nil {
        return errors.New("user is nil")
    }
    query := `UPDATE users SET skills = $1, bio = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`
    cmdTag, err := r.pool.Exec(ctx, query, u.Skills, u.Bio, u.ID)
    if err != nil {
        return err
    }
    if cmdTag.RowsAffected() == 0 {
        return errors.New("no rows updated")
    }
    return nil
}

func (r *postgresUserRepo) UpdateAvatar(ctx context.Context, id int64, avatarURL string) error {
    query := `UPDATE users SET avatar_url = $1::text, updated_at = NOW() WHERE id = $2::bigint AND deleted_at IS NULL`
    
    // Log the update attempt
    fmt.Printf("[postgresUserRepo.UpdateAvatar] Executing query for id=%d, avatarURL=%s\n", id, avatarURL)
    
    cmdTag, err := r.pool.Exec(ctx, query, avatarURL, id)
    if err != nil {
        fmt.Printf("[postgresUserRepo.UpdateAvatar] Query failed: %v\n", err)
        return err
    }
    
    rowsAffected := cmdTag.RowsAffected()
    fmt.Printf("[postgresUserRepo.UpdateAvatar] Query succeeded. Rows affected: %d\n", rowsAffected)
    
    if rowsAffected == 0 {
        return errors.New("no rows updated")
    }
    return nil
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

func (r *postgresUserRepo) List(ctx context.Context, skills []string) ([]*domain.User, error) {
    base := `SELECT id, username, email, skills, bio, avatar_url, created_at, updated_at FROM users WHERE deleted_at IS NULL`
    args := []any{}
    idx := 1

    if len(skills) > 0 {
        base += ` AND skills && $1`
        args = append(args, skills)
        idx++
    }

    rows, err := r.pool.Query(ctx, base, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results []*domain.User
    for rows.Next() {
        var u domain.User
        if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Skills, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt); err != nil {
            return nil, err
        }
        results = append(results, &u)
    }
    return results, nil
}
