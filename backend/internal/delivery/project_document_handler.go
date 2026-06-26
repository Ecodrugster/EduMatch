package delivery

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"edumatch/internal/domain"
	"edumatch/internal/service"
	"github.com/gin-gonic/gin"
)

type ProjectDocumentHandler struct {
	svc *service.ProjectDocumentService
}

func NewProjectDocumentHandler(svc *service.ProjectDocumentService) *ProjectDocumentHandler {
	return &ProjectDocumentHandler{svc: svc}
}

func (h *ProjectDocumentHandler) UploadDocument(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, err := strconv.ParseInt(userIDStr.(string), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	file, err := c.FormFile("document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document file is required"})
		return
	}

	// Validate file type (only .pdf, .docx, .doc)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".docx" && ext != ".doc" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only PDF and Word documents (.pdf, .docx, .doc) are allowed"})
		return
	}

	// Create uploads/documents directory if not exists
	err = os.MkdirAll("uploads/documents", os.ModePerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create upload directory"})
		return
	}

	// Generate safe filename: <project_id>_<timestamp>_<original_name_sanitized>
	// Safe characters only in filename
	safeBaseName := filepath.Base(file.Filename)
	filename := fmt.Sprintf("%d_%d_%s", projectID, time.Now().Unix(), safeBaseName)
	filePath := filepath.Join("uploads", "documents", filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	docURL := "/uploads/documents/" + filename

	doc := &domain.ProjectDocument{
		ProjectID: projectID,
		Name:      file.Filename,
		FilePath:  docURL,
		FileSize:  file.Size,
	}

	if err := h.svc.Upload(c.Request.Context(), doc, userID); err != nil {
		// Clean up the uploaded file if database insert fails
		_ = os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"document": doc})
}

func (h *ProjectDocumentHandler) ListDocuments(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, err := strconv.ParseInt(userIDStr.(string), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	documents, err := h.svc.List(c.Request.Context(), projectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if documents == nil {
		documents = []*domain.ProjectDocument{}
	}

	c.JSON(http.StatusOK, gin.H{"documents": documents})
}

func (h *ProjectDocumentHandler) DeleteDocument(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, err := strconv.ParseInt(userIDStr.(string), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	docIDStr := c.Param("docId")
	docID, err := strconv.ParseInt(docIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), docID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "document deleted successfully"})
}
