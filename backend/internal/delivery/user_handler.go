package delivery

import (
	"net/http"
	"strconv"
	"strings"

	"edumatch/internal/service"
	"github.com/gin-gonic/gin"
)

// GetProfileHandler handles fetching the current user's profile
func GetProfileHandler(c *gin.Context, svc *service.UserService) {
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

	user, err := svc.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateProfileHandler handles обновляет профиль пользователя
func UpdateProfileHandler(c *gin.Context, svc *service.UserService) {
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

	var in struct {
		Skills []string `json:"skills"`
		Bio    string   `json:"bio"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := svc.UpdateProfile(c.Request.Context(), userID, in.Skills, in.Bio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// GetUsersHandler handles fetching users filtered by skills
func GetUsersHandler(c *gin.Context, svc *service.UserService) {
	var skills []string
	if skillsStr := c.Query("skills"); skillsStr != "" {
		parts := strings.Split(skillsStr, ",")
		for _, p := range parts {
			skills = append(skills, strings.TrimSpace(p))
		}
	}

	users, err := svc.ListUsers(c.Request.Context(), skills)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
