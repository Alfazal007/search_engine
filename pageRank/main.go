package main

import (
	"context"
	"database/sql"
	"log"
	"os"

	"pageRanker/helpers"
	"pageRanker/internal/database"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

// this means that 85 percent it will be crawling same page links else completely random links
const DAMPING_FACTOR = 85

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	_, err = rdb.Ping(ctx).Result()
	cancel()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
		return
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB url is not found in env variables")
	}
	conn, err := sql.Open("postgres", dbURL)
	database_connection := database.New(conn)

	context := context.Background()
	url := helpers.GetRandomUrl(database_connection, context)
	helpers.CrawlPage(url.Url, DAMPING_FACTOR, context, rdb, database_connection)
}

