package delivery

import (
	"net/http"
	"strconv"

	"edumatch/internal/domain"
	"edumatch/internal/repository"
	"edumatch/internal/service"

	"github.com/gin-gonic/gin"
)

// GetProjectsHandle
func GetProjectsHandler(c *gin.Context, svc *service.ProjectService) {
	userIDStr, _ := c.Get("userID")
	userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
	filter := repository.ProjectFilter{OwnerID: userID}
	projects, err := svc.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// CreateProjectHandler
func CreateProjectHandler(c *gin.Context, svc *service.ProjectService) {
	var in struct {
		Title          string   `json:"title" binding:"required"`
		Description    string   `json:"description"`
		SkillsRequired []string `json:"skills_required" binding:"required"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userIDStr, _ := c.Get("userID")
	ownerID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
	proj := &domain.Project{OwnerID: ownerID, Title: in.Title, Description: in.Description, SkillsRequired: in.SkillsRequired}
	if err := svc.Create(c.Request.Context(), proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"project": proj})
}

// GetProjectHandler
func GetProjectHandler(c *gin.Context, svc *service.ProjectService) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	proj, err := svc.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": proj})
}

func UpdateProjectHandler(c *gin.Context, svc *service.ProjectService) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var in struct {
		Title          string   `json:"title"`
		Description    string   `json:"description"`
		SkillsRequired []string `json:"skills_required"`
		IsOpen         *bool    `json:"is_open"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	proj, err := svc.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if in.Title != "" {
		proj.Title = in.Title
	}
	if in.Description != "" {
		proj.Description = in.Description
	}
	if in.SkillsRequired != nil {
		proj.SkillsRequired = in.SkillsRequired
	}
	if in.IsOpen != nil {
		proj.IsOpen = *in.IsOpen
	}
	if err := svc.Update(c.Request.Context(), proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": proj})
}

// DeleteProjectHandler
func DeleteProjectHandler(c *gin.Context, svc *service.ProjectService) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := svc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
