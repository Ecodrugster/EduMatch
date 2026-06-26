package delivery

import (
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"edumatch/internal/domain"
	"edumatch/internal/repository"
	"edumatch/internal/service"

	"github.com/gin-gonic/gin"
)

// GetMyProjectsHandler
func GetMyProjectsHandler(c *gin.Context, svc *service.ProjectService) {
	userIDStr, _ := c.Get("userID")
	userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
	filter := repository.ProjectFilter{InvolvedUserID: userID}
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
		Title          string     `json:"title" binding:"required"`
		Description    string     `json:"description"`
		SkillsRequired []string   `json:"skills_required" binding:"required"`
		StartDate      *time.Time `json:"start_date"`
		EndDate        *time.Time `json:"end_date"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userIDStr, _ := c.Get("userID")
	ownerID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
	proj := &domain.Project{
		OwnerID:        ownerID,
		Title:          in.Title,
		Description:    in.Description,
		SkillsRequired: in.SkillsRequired,
		StartDate:      in.StartDate,
		EndDate:        in.EndDate,
	}
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
		Title          string     `json:"title"`
		Description    string     `json:"description"`
		SkillsRequired []string   `json:"skills_required"`
		IsOpen         *bool      `json:"is_open"`
		StartDate      *time.Time `json:"start_date"`
		EndDate        *time.Time `json:"end_date"`
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
	if in.StartDate != nil {
		proj.StartDate = in.StartDate
	}
	if in.EndDate != nil {
		proj.EndDate = in.EndDate
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

type StudentRecommendation struct {
	*domain.User
	MatchScore int `json:"match_score"`
}

// GetRecommendedStudentsHandler returns students matching the project requirements
func GetRecommendedStudentsHandler(
	c *gin.Context, 
	projectSvc *service.ProjectService, 
	userSvc *service.UserService, 
	memberSvc *service.MemberService,
) {
	projectID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	userIDStr, _ := c.Get("userID")
	userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)

	project, err := projectSvc.Get(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the project owner can view recommendations"})
		return
	}

	// Fetch users who match required skills
	users, err := userSvc.ListUsers(c.Request.Context(), project.SkillsRequired)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing members
	members, err := memberSvc.ListByProject(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	excludeIDs := make(map[int64]bool)
	excludeIDs[project.OwnerID] = true
	for _, m := range members {
		excludeIDs[m.UserID] = true
	}

	var recommendations []StudentRecommendation
	for _, u := range users {
		if excludeIDs[u.ID] {
			continue
		}

		matchScore := 0
		if len(project.SkillsRequired) > 0 {
			matched := 0
			for _, reqSkill := range project.SkillsRequired {
				for _, userSkill := range u.Skills {
					if strings.EqualFold(reqSkill, userSkill) {
						matched++
						break
					}
				}
			}
			matchScore = int((float64(matched) / float64(len(project.SkillsRequired))) * 100)
		} else {
			// If project requires no skills, everyone matches 100%
			matchScore = 100
		}

		recommendations = append(recommendations, StudentRecommendation{
			User:       u,
			MatchScore: matchScore,
		})
	}

	// Sort by match score descending
	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	c.JSON(http.StatusOK, gin.H{"students": recommendations})
}

// InviteStudentHandler sends a notification to the invited student
func InviteStudentHandler(
	c *gin.Context, 
	projectSvc *service.ProjectService, 
	notificationSvc *service.NotificationService,
) {
	projectID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	userIDStr, _ := c.Get("userID")
	userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)

	var req struct {
		UserID int64 `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := projectSvc.Get(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the project owner can invite students"})
		return
	}

	// Create notification
	notif := &domain.Notification{
		UserID:    req.UserID,
		Type:      "project_invite",
		Message:   "Вы приглашены в проект \"" + project.Title + "\"!",
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if err := notificationSvc.Create(c.Request.Context(), notif); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation sent successfully"})
}

