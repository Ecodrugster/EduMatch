package delivery

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"edumatch/internal/domain"
	"edumatch/internal/repository"
	"edumatch/internal/service"

	"github.com/gin-gonic/gin"
)

// GetMyProjectsHandler handles fetching projects owned by the current user
func GetMyProjectsHandler(c *gin.Context, svc *service.ProjectService) {
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

type ProjectResponse struct {
	*domain.Project
	MatchScore int `json:"match_score"`
}

// GetProjectsHandler handles fetching projects with global filtering and matching
func GetProjectsHandler(c *gin.Context, svc *service.ProjectService, userSvc *service.UserService) {
	filter := repository.ProjectFilter{}

	if title := c.Query("title"); title != "" {
		filter.TitleContains = title
	}
	if skillsStr := c.Query("skills"); skillsStr != "" {
		skills := strings.Split(skillsStr, ",")
		for i := range skills {
			skills[i] = strings.TrimSpace(skills[i])
		}
		filter.Skills = skills
	}
	if openOnly := c.Query("open_only"); openOnly == "true" {
		filter.OpenOnly = true
	}

	projects, err := svc.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := c.Get("userID")
	userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
	
	userProfile, err := userSvc.GetProfile(c.Request.Context(), userID)
	var userSkills []string
	if err == nil && userProfile != nil {
		userSkills = userProfile.Skills
	}

	var response []ProjectResponse
	for _, p := range projects {
		matchScore := 0
		if len(p.SkillsRequired) > 0 {
			matched := 0
			for _, reqSkill := range p.SkillsRequired {
				for _, userSkill := range userSkills {
					if strings.EqualFold(reqSkill, userSkill) {
						matched++
						break
					}
				}
			}
			matchScore = int((float64(matched) / float64(len(p.SkillsRequired))) * 100)
		}
		response = append(response, ProjectResponse{Project: p, MatchScore: matchScore})
	}

	// Sort by match score descending
	sort.Slice(response, func(i, j int) bool {
		return response[i].MatchScore > response[j].MatchScore
	})

	c.JSON(http.StatusOK, gin.H{"projects": response})
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
