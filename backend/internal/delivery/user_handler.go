package delivery

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

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

// GetUserHandler handles fetching a user's profile by ID
func GetUserHandler(c *gin.Context, svc *service.UserService) {
	idStr := c.Param("id")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := svc.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UploadAvatarHandler handles profile photo upload
func UploadAvatarHandler(c *gin.Context, svc *service.UserService) {
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

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "avatar file is required"})
		return
	}

	// Create uploads/avatars directory if not exists
	err = os.MkdirAll("uploads/avatars", os.ModePerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create upload directory"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join("uploads", "avatars", filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	avatarURL := "/uploads/avatars/" + filename

	if err := svc.UpdateAvatar(c.Request.Context(), userID, avatarURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"avatar_url": avatarURL})
}

