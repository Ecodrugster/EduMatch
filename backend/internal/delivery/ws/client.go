package ws

import (
    "bytes"
    "log"
    "time"
    "encoding/json"
    "github.com/gorilla/websocket"
    "edumatch/internal/domain"
)

const (
    // Time allowed to write a message to the peer.
    writeWait = 10 * time.Second

    // Time allowed to read the next pong message from the peer.
    pongWait = 60 * time.Second

    // Send pings to peer with this period. Must be less than pongWait.
    pingPeriod = (pongWait * 9) / 10

    // Maximum message size allowed from peer.
    maxMessageSize = 512
)

var (
    newline = []byte{'\n'}
    space   = []byte{' '}
)

type Client struct {
    Hub *Hub

    // The websocket connection.
    Conn *websocket.Conn

    // Buffered channel of outbound messages.
    Send chan *domain.Message

    ProjectID int64
    UserID    int64
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) ReadPump() {
    defer func() {
        c.Hub.Unregister <- c
        c.Conn.Close()
    }()
    c.Conn.SetReadLimit(maxMessageSize)
    c.Conn.SetReadDeadline(time.Now().Add(pongWait))
    c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
    for {
        _, message, err := c.Conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("error: %v", err)
            }
            break
        }
        message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
        
        msg := &domain.Message{
            ProjectID: c.ProjectID,
            SenderID:  c.UserID,
            Content:   string(message),
        }
        c.Hub.Broadcast <- msg
    }
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.Conn.Close()
    }()
    for {
        select {
        case message, ok := <-c.Send:
            c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                // The hub closed the channel.
                c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            w, err := c.Conn.NextWriter(websocket.TextMessage)
            if err != nil {
                return
            }
            
            data, _ := json.Marshal(message)
            w.Write(data)

            // Add queued chat messages to the current websocket message.
            n := len(c.Send)
            for i := 0; i < n; i++ {
                w.Write(newline)
                data, _ := json.Marshal(<-c.Send)
                w.Write(data)
            }

            if err := w.Close(); err != nil {
                return
            }
        case <-ticker.C:
            c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
