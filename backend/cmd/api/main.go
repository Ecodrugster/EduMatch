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

    hub := ws.NewHub(messageService)
    go hub.Run()

    
    router := gin.Default()
    router.GET("/swagger/*any", swagger.WrapHandler(swaggerFiles.Handler))
    
    authRouter := router.Group("/auth")
    authRouter.POST("/signup", func(c *gin.Context) { delivery.SignUpHandler(c, userService) })
    authRouter.POST("/login", func(c *gin.Context) { delivery.LoginHandler(c, userService) })
    authRouter.POST("/refresh", func(c *gin.Context) { delivery.RefreshHandler(c, userService) })
   
    protected := router.Group("/protected")
    protected.Use(delivery.AuthMiddleware(cfg))
    protected.GET("/ping", delivery.PingHandler)
    
    // Profile
    protected.GET("/profile", func(c *gin.Context) { delivery.GetProfileHandler(c, userService) })
    protected.PATCH("/profile", func(c *gin.Context) { delivery.UpdateProfileHandler(c, userService) })

    // Projects
    protected.GET("/projects", func(c *gin.Context) { delivery.GetProjectsHandler(c, projectService, userService) })
    protected.GET("/projects/my", func(c *gin.Context) { delivery.GetMyProjectsHandler(c, projectService) })
    protected.POST("/projects", func(c *gin.Context) { delivery.CreateProjectHandler(c, projectService) })
    protected.GET("/projects/:id", func(c *gin.Context) { delivery.GetProjectHandler(c, projectService) })
    protected.PATCH("/projects/:id", func(c *gin.Context) { delivery.UpdateProjectHandler(c, projectService) })
    protected.DELETE("/projects/:id", func(c *gin.Context) { delivery.DeleteProjectHandler(c, projectService) })
    protected.POST("/applications", func(c *gin.Context) { delivery.CreateApplicationHandler(c, applicationService) })
    protected.GET("/applications/:id", func(c *gin.Context) { delivery.GetApplicationHandler(c, applicationService) })
    protected.PATCH("/applications/:id/status", func(c *gin.Context) { delivery.UpdateApplicationStatusHandler(c, applicationService, memberService) })
    protected.GET("/applications", func(c *gin.Context) { delivery.ListApplicationsHandler(c, applicationService) })
    
    protected.GET("/ws/:project_id", func(c *gin.Context) { delivery.ServeWS(hub, c) })
    protected.GET("/messages", func(c *gin.Context) { delivery.ListMessagesHandler(c, messageService) })
    
    protected.POST("/members", func(c *gin.Context) { delivery.AddMemberHandler(c, memberService) })
    protected.GET("/members", func(c *gin.Context) { delivery.ListMembersHandler(c, memberService) })
  
    log.Printf("Server starting on %s", cfg.ServerAddress())
    if err := router.Run(cfg.ServerAddress()); err != nil {
        log.Fatalf("Failed to run server: %v", err)
    }
}
