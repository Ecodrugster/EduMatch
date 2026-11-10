FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/api .
COPY --from=builder /app/internal/migrations ./internal/migrations
RUN mkdir -p uploads/avatars uploads/documents

EXPOSE 8080
ENV PORT=8080
CMD ["./api"]
