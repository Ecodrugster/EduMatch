package delivery

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

// CreateApplicationHandler
func CreateApplicationHandler(c *gin.Context, svc *service.ApplicationService) {
    var in struct {
        ProjectID int64  `json:"project_id" binding:"required"`
        UserID    int64  `json:"user_id" binding:"required"`
        Message   string `json:"message" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    app := &domain.Application{ProjectID: in.ProjectID, UserID: in.UserID, Message: in.Message, Status: "pending"}
    if err := svc.Create(c.Request.Context(), app); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"application": app})
}

// GetApplicationHandler
func GetApplicationHandler(c *gin.Context, svc *service.ApplicationService) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    app, err := svc.Get(c.Request.Context(), id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"application": app})
}

// UpdateApplicationStatusHandler
func UpdateApplicationStatusHandler(c *gin.Context, svc *service.ApplicationService) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    var in struct {
        Status string `json:"status" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := svc.UpdateStatus(c.Request.Context(), id, in.Status); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.Status(http.StatusNoContent)
}

// ListApplicationsHandler
func ListApplicationsHandler(c *gin.Context, svc *service.ApplicationService) {
    // Expect userID from auth middleware
    userIDStr, _ := c.Get("userID")
    userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
    apps, err := svc.ListByUser(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"applications": apps})
}
