package delivery

import (
    "net/http"
    "strconv"
    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

type NotificationHandler struct {
    notificationService *service.NotificationService
}

func NewNotificationHandler(ns *service.NotificationService) *NotificationHandler {
    return &NotificationHandler{notificationService: ns}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
    userIDStr, _ := c.Get("userID")
    userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)

    notifications, err := h.notificationService.ListByUser(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
        return
    }
    if notifications == nil {
        notifications = []*domain.Notification{} // prevent null in JSON
    }

    c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
    notificationIDStr := c.Param("id")
    notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
        return
    }

    // In a real app, verify the notification belongs to the user
    if err := h.notificationService.MarkAsRead(c.Request.Context(), notificationID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as read"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
    userIDStr, _ := c.Get("userID")
    userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)

    if err := h.notificationService.MarkAllAsRead(c.Request.Context(), userID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all as read"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "All marked as read"})
}
