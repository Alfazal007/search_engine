package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"
	"webcrawler/crawl"
	"webcrawler/helpers"
	"webcrawler/internal/database"
	"webcrawler/types"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	log "github.com/sirupsen/logrus"
)

func main() {
	log.Info("Started the crawler application")
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

	log.WithFields(log.Fields{
		"Address": rdb.Options().Addr,
	}).Info("Connected to redis")
	log.Info("Starting to crawl the urls")
	number_of_queues, my_position := helpers.GetServerData()
	timestamp := types.TimeStamp{
		Timestamp:       time.Now().Unix(),
		Mutex:           sync.RWMutex{},
		HasDataToUpload: false,
	}
	go createFolders(&timestamp, database_connection)
	crawl.GetUrlAndCrawl(rdb, number_of_queues, my_position, database_connection, &timestamp)
}

func createFolders(timestamp *types.TimeStamp, database_connection *database.Queries) {
	for {
		timestamp.Mutex.Lock()
		previous_timestamp := timestamp.Timestamp
		timestamp.Timestamp = time.Now().Unix()
		err := os.Mkdir(fmt.Sprintf("savedPages/%v", strconv.FormatInt(timestamp.Timestamp, 10)), 0755)
		helpers.Assert(err == nil, fmt.Sprintf("Issue creating the save folder, %v", err))
		needToUpload := timestamp.HasDataToUpload
		if !needToUpload {
			timestamp.HasDataToUpload = true
		}
		timestamp.Mutex.Unlock()
		helpers.Assert(err == nil, "Issue creating the directory")
		if needToUpload {
			secure_url := helpers.UploadPreviousFolder(previous_timestamp)
			// create the entry into the database for prev crawled thing and then fetch and update the cloudinary in the indexer for this
			database_connection.CreateCrawlEntry(context.Background(), database.CreateCrawlEntryParams{
				SecureUrl: secure_url,
				Crawledat: previous_timestamp,
			})
		}
		time.Sleep(1 * time.Minute)
	}
}
