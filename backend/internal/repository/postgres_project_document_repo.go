package repository

import (
	"context"
	"time"
	"edumatch/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresProjectDocumentRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresProjectDocumentRepo(pool *pgxpool.Pool) ProjectDocumentRepo {
	return &postgresProjectDocumentRepo{pool: pool}
}

func (r *postgresProjectDocumentRepo) Create(ctx context.Context, d *domain.ProjectDocument) error {
	const q = `
		INSERT INTO project_documents (project_id, uploaded_by, name, file_path, file_size, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`
	now := time.Now().UTC()
	err := r.pool.QueryRow(ctx, q, d.ProjectID, d.UploadedBy, d.Name, d.FilePath, d.FileSize, now).Scan(&d.ID)
	if err != nil {
		return err
	}
	d.CreatedAt = now
	return nil
}

func (r *postgresProjectDocumentRepo) ListByProject(ctx context.Context, projectID int64) ([]*domain.ProjectDocument, error) {
	const q = `
		SELECT id, project_id, uploaded_by, name, file_path, file_size, created_at
		FROM project_documents
		WHERE project_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC;
	`
	rows, err := r.pool.Query(ctx, q, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []*domain.ProjectDocument
	for rows.Next() {
		var d domain.ProjectDocument
		err := rows.Scan(&d.ID, &d.ProjectID, &d.UploadedBy, &d.Name, &d.FilePath, &d.FileSize, &d.CreatedAt)
		if err != nil {
			return nil, err
		}
		documents = append(documents, &d)
	}
	return documents, nil
}

func (r *postgresProjectDocumentRepo) GetByID(ctx context.Context, id int64) (*domain.ProjectDocument, error) {
	const q = `
		SELECT id, project_id, uploaded_by, name, file_path, file_size, created_at
		FROM project_documents
		WHERE id = $1 AND deleted_at IS NULL;
	`
	var d domain.ProjectDocument
	err := r.pool.QueryRow(ctx, q, id).Scan(&d.ID, &d.ProjectID, &d.UploadedBy, &d.Name, &d.FilePath, &d.FileSize, &d.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *postgresProjectDocumentRepo) Delete(ctx context.Context, id int64) error {
	const q = `
		UPDATE project_documents
		SET deleted_at = $1
		WHERE id = $2;
	`
	now := time.Now().UTC()
	_, err := r.pool.Exec(ctx, q, now, id)
	return err
}
