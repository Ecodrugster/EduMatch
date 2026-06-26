package service

import (
	"context"
	"errors"
	"fmt"

	"edumatch/internal/domain"
	"edumatch/internal/repository"
)

type ProjectDocumentService struct {
	docRepo     repository.ProjectDocumentRepo
	memberRepo  repository.MemberRepo
	projectRepo repository.ProjectRepo
}

func NewProjectDocumentService(
	docRepo repository.ProjectDocumentRepo,
	memberRepo repository.MemberRepo,
	projectRepo repository.ProjectRepo,
) *ProjectDocumentService {
	return &ProjectDocumentService{
		docRepo:     docRepo,
		memberRepo:  memberRepo,
		projectRepo: projectRepo,
	}
}

func (s *ProjectDocumentService) Upload(ctx context.Context, doc *domain.ProjectDocument, userID int64) error {
	// Check if user is a member/owner of the project
	isMember, err := s.memberRepo.IsMember(ctx, doc.ProjectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return errors.New("unauthorized: user is not a member of this project")
	}

	doc.UploadedBy = userID
	return s.docRepo.Create(ctx, doc)
}

func (s *ProjectDocumentService) List(ctx context.Context, projectID, userID int64) ([]*domain.ProjectDocument, error) {
	// Check membership
	isMember, err := s.memberRepo.IsMember(ctx, projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, errors.New("unauthorized: user is not a member of this project")
	}

	return s.docRepo.ListByProject(ctx, projectID)
}

func (s *ProjectDocumentService) Delete(ctx context.Context, docID, userID int64) error {
	doc, err := s.docRepo.GetByID(ctx, docID)
	if err != nil {
		return fmt.Errorf("failed to get document: %w", err)
	}

	// User can delete if they uploaded it
	if doc.UploadedBy == userID {
		return s.docRepo.Delete(ctx, docID)
	}

	// Or if they are the project owner
	project, err := s.projectRepo.GetByID(ctx, doc.ProjectID)
	if err != nil {
		return fmt.Errorf("failed to get project: %w", err)
	}

	if project.OwnerID == userID {
		return s.docRepo.Delete(ctx, docID)
	}

	return errors.New("unauthorized: only the uploader or project owner can delete this document")
}
