package delivery

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

import "github.com/gorilla/websocket"
import "edumatch/internal/delivery/ws"

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

// ServeWS handles websocket requests from the peer.
func ServeWS(hub *ws.Hub, c *gin.Context) {
    projectID, err := strconv.ParseInt(c.Param("project_id"), 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID"})
        return
    }

    // Assuming AuthMiddleware sets userID in context
    userIDStr := c.GetString("userID")
    userID, _ := strconv.ParseInt(userIDStr, 10, 64)

    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        return
    }
    client := &ws.Client{
        Hub:       hub,
        Conn:      conn,
        Send:      make(chan *domain.Message, 256),
        ProjectID: projectID,
        UserID:    userID,
    }
    client.Hub.Register <- client

    // Allow collection of memory referenced by the caller by doing all work in
    // new goroutines.
    go client.WritePump()
    go client.ReadPump()
}

// ListMessagesHandler
func ListMessagesHandler(c *gin.Context, svc *service.MessageService) {
    projectID, _ := strconv.ParseInt(c.Query("project_id"), 10, 64)
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
    offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
    msgs, err := svc.ListByProject(c.Request.Context(), projectID, limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"messages": msgs})
}
