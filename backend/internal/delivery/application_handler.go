package delivery

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

func CreateApplicationHandler(c *gin.Context, svc *service.ApplicationService, projSvc *service.ProjectService, notifSvc *service.NotificationService) {
    var in struct {
        ProjectID int64  `json:"project_id" binding:"required"`
        Message   string `json:"message" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userIDStr, _ := c.Get("userID")
    userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)

    app := &domain.Application{ProjectID: in.ProjectID, UserID: userID, Message: in.Message, Status: "pending"}
    if err := svc.Create(c.Request.Context(), app); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Send notification to project owner
    proj, err := projSvc.Get(c.Request.Context(), in.ProjectID)
    if err == nil && proj.OwnerID != userID {
        notifSvc.Create(c.Request.Context(), &domain.Notification{
            UserID:  proj.OwnerID,
            Type:    "NEW_APPLICATION",
            Message: "У вас новая заявка в проект: " + proj.Title,
        })
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
func UpdateApplicationStatusHandler(c *gin.Context, svc *service.ApplicationService, memberSvc *service.MemberService, notifSvc *service.NotificationService) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    var in struct {
        Status string `json:"status" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    app, err := svc.Get(c.Request.Context(), id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
        return
    }

    if err := svc.UpdateStatus(c.Request.Context(), id, in.Status); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if in.Status == "approved" && app.Status != "approved" {
        memberSvc.Add(c.Request.Context(), &domain.Member{
            ProjectID: app.ProjectID,
            UserID:    app.UserID,
        })
        notifSvc.Create(c.Request.Context(), &domain.Notification{
            UserID:  app.UserID,
            Type:    "APPLICATION_APPROVED",
            Message: "Ваша заявка в проект была одобрена!",
        })
    } else if in.Status == "rejected" && app.Status != "rejected" {
        notifSvc.Create(c.Request.Context(), &domain.Notification{
            UserID:  app.UserID,
            Type:    "APPLICATION_REJECTED",
            Message: "Ваша заявка в проект была отклонена.",
        })
    }

    c.Status(http.StatusNoContent)
}

// ListApplicationsHandler
func ListApplicationsHandler(c *gin.Context, svc *service.ApplicationService) {
    var apps []*domain.Application
    var err error

    if projIDStr := c.Query("project_id"); projIDStr != "" {
        projectID, _ := strconv.ParseInt(projIDStr, 10, 64)
        apps, err = svc.ListByProject(c.Request.Context(), projectID)
    } else {
        userIDStr, _ := c.Get("userID")
        userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
        apps, err = svc.ListByUser(c.Request.Context(), userID)
    }

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // frontend crashes
    if apps == nil {
        apps = []*domain.Application{}
    }
    c.JSON(http.StatusOK, gin.H{"applications": apps})
}
