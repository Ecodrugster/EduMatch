package ws

import (
    "context"
    "log"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

type Message struct {
    ProjectID int64
    SenderID  int64
    Content   string
}

type Hub struct {
    // Registered clients by project ID
    Rooms map[int64]map[*Client]bool

    // Inbound messages from the clients.
    Broadcast chan *domain.Message

    // Register requests from the clients.
    Register chan *Client

    // Unregister requests from clients.
    Unregister chan *Client

    messageService *service.MessageService
}

func NewHub(messageService *service.MessageService) *Hub {
    return &Hub{
        Rooms:          make(map[int64]map[*Client]bool),
        Broadcast:      make(chan *domain.Message),
        Register:       make(chan *Client),
        Unregister:     make(chan *Client),
        messageService: messageService,
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.Register:
            if h.Rooms[client.ProjectID] == nil {
                h.Rooms[client.ProjectID] = make(map[*Client]bool)
            }
            h.Rooms[client.ProjectID][client] = true
        case client := <-h.Unregister:
            if clients, ok := h.Rooms[client.ProjectID]; ok {
                if _, ok := clients[client]; ok {
                    delete(clients, client)
                    close(client.Send)
                    if len(clients) == 0 {
                        delete(h.Rooms, client.ProjectID)
                    }
                }
            }
        case message := <-h.Broadcast:
            // Save to DB
            err := h.messageService.Create(context.Background(), message)
            if err != nil {
                log.Println("Error saving message:", err)
                continue
            }

            // Broadcast to the room
            if clients, ok := h.Rooms[message.ProjectID]; ok {
                for client := range clients {
                    select {
                    case client.Send <- message:
                    default:
                        close(client.Send)
                        delete(clients, client)
                    }
                }
            }
        }
    }
}
