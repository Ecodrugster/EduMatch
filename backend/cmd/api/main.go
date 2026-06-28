package main

import (
    "log"
    "edumatch/config"
    "edumatch/internal/infra"
    "edumatch/internal/repository"
    "edumatch/internal/service"
    "edumatch/internal/delivery"
    "edumatch/internal/delivery/ws"
    "github.com/gin-gonic/gin"
swaggerFiles "github.com/swaggo/files"
    swagger "github.com/swaggo/gin-swagger"
    _ "edumatch/docs"
)

func main() {
   
    config.Load()
    cfg := config.AppConfig

    
    pgPool := infra.InitPostgres(cfg)
    defer pgPool.Close()
    redisClient := infra.InitRedis(cfg)
    defer func() { _ = redisClient.Close() }()

   
    repos := repository.NewRepositories(pgPool)

    
    userService := service.NewUserService(repos.User, cfg, redisClient)
    projectService := service.NewProjectService(repos.Project, cfg, redisClient)
    applicationService := service.NewApplicationService(repos.Application, cfg, redisClient)
    messageService := service.NewMessageService(repos.Message, cfg, redisClient)
    memberService := service.NewMemberService(repos.Member, cfg, redisClient)
    taskService := service.NewTaskService(repos.Task)
    notificationService := service.NewNotificationService(repos.Notification)
    projectDocumentService := service.NewProjectDocumentService(repos.ProjectDocument, repos.Member, repos.Project)

    hub := ws.NewHub(messageService)
    go hub.Run()

    router := gin.Default()
    router.Static("/uploads", "./uploads")
    router.GET("/swagger/*any", swagger.WrapHandler(swaggerFiles.Handler))
    
    authRouter := router.Group("/auth")
    authRouter.POST("/signup", func(c *gin.Context) { delivery.SignUpHandler(c, userService) })
    authRouter.POST("/login", func(c *gin.Context) { delivery.LoginHandler(c, userService) })
    authRouter.POST("/refresh", func(c *gin.Context) { delivery.RefreshHandler(c, userService) })
   
    protected := router.Group("/protected")
    protected.Use(delivery.AuthMiddleware(cfg))
    protected.GET("/ping", delivery.PingHandler)
    
    // Profile and Users
    protected.GET("/profile", func(c *gin.Context) { delivery.GetProfileHandler(c, userService) })
    protected.PATCH("/profile", func(c *gin.Context) { delivery.UpdateProfileHandler(c, userService) })
    protected.POST("/profile/avatar", func(c *gin.Context) { delivery.UploadAvatarHandler(c, userService) })
    protected.GET("/users", func(c *gin.Context) { delivery.GetUsersHandler(c, userService) })
    protected.GET("/users/:id", func(c *gin.Context) { delivery.GetUserHandler(c, userService) })

    // Projects
    protected.GET("/projects", func(c *gin.Context) { delivery.GetProjectsHandler(c, projectService, userService) })
    protected.GET("/projects/my", func(c *gin.Context) { delivery.GetMyProjectsHandler(c, projectService) })
    protected.POST("/projects", func(c *gin.Context) { delivery.CreateProjectHandler(c, projectService) })
    protected.GET("/projects/:id", func(c *gin.Context) { delivery.GetProjectHandler(c, projectService) })
    protected.PATCH("/projects/:id", func(c *gin.Context) { delivery.UpdateProjectHandler(c, projectService) })
    protected.DELETE("/projects/:id", func(c *gin.Context) { delivery.DeleteProjectHandler(c, projectService) })
    protected.GET("/projects/:id/recommended-students", func(c *gin.Context) { delivery.GetRecommendedStudentsHandler(c, projectService, userService, memberService) })
    protected.POST("/projects/:id/invite", func(c *gin.Context) { delivery.InviteStudentHandler(c, projectService, notificationService, applicationService) })
    protected.POST("/projects/:id/leave", func(c *gin.Context) { delivery.LeaveProjectHandler(c, memberService) })
    
    // Applications
    protected.POST("/applications", func(c *gin.Context) { delivery.CreateApplicationHandler(c, applicationService, projectService, notificationService) })
    protected.GET("/applications/:id", func(c *gin.Context) { delivery.GetApplicationHandler(c, applicationService) })
    protected.PATCH("/applications/:id/status", func(c *gin.Context) { delivery.UpdateApplicationStatusHandler(c, applicationService, memberService, notificationService, projectService) })
    protected.GET("/applications", func(c *gin.Context) { delivery.ListApplicationsHandler(c, applicationService) })
    
    // Chat & WS
    protected.GET("/ws/:project_id", func(c *gin.Context) { delivery.ServeWS(hub, c) })
    protected.GET("/messages", func(c *gin.Context) { delivery.ListMessagesHandler(c, messageService) })
    
    // Members
    protected.POST("/members", func(c *gin.Context) { delivery.AddMemberHandler(c, memberService) })
    protected.GET("/members", func(c *gin.Context) { delivery.ListMembersHandler(c, memberService) })
    
    // Tasks
    taskHandler := delivery.NewTaskHandler(taskService, memberService)
    protected.POST("/projects/:id/tasks", taskHandler.CreateTask)
    protected.GET("/projects/:id/tasks", taskHandler.GetTasks)
    protected.PATCH("/tasks/:taskId/status", taskHandler.UpdateTaskStatus)
    protected.DELETE("/tasks/:taskId", taskHandler.DeleteTask)
    
    // Notifications
    notificationHandler := delivery.NewNotificationHandler(notificationService)
    protected.GET("/notifications", notificationHandler.GetNotifications)
    protected.PATCH("/notifications/:id/read", notificationHandler.MarkAsRead)
    protected.POST("/notifications/read-all", notificationHandler.MarkAllAsRead)

    // Documents
    documentHandler := delivery.NewProjectDocumentHandler(projectDocumentService)
    protected.POST("/projects/:id/documents", documentHandler.UploadDocument)
    protected.GET("/projects/:id/documents", documentHandler.ListDocuments)
    protected.DELETE("/projects/:id/documents/:docId", documentHandler.DeleteDocument)
  
    log.Printf("Server starting on %s", cfg.ServerAddress())
    if err := router.Run(cfg.ServerAddress()); err != nil {
        log.Fatalf("Failed to run server: %v", err)
    }
}
