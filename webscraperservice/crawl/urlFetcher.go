package crawl

import (
	"context"
	"fmt"
	"strconv"
	"time"
	"webcrawler/helpers"
	"webcrawler/internal/database"
	"webcrawler/types"

	"github.com/gocolly/colly"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	log "github.com/sirupsen/logrus"
)

func GetUrlAndCrawl(rdb *redis.Client, number_of_queues int32, my_position int32, conn *database.Queries, timestamp *types.TimeStamp) {
	log.Info("Fetching redis urls")
	queue_number_to_fetch_from := (my_position + 1) % number_of_queues
	// the queues will be names 0 1 2 3 4 ...and so onfmt.Sprintf("url_queue_", queue_to_fetch_from)
	queue_to_fetch_from := fmt.Sprintf("url_queue_%v", queue_number_to_fetch_from)
	log.WithField("queue_number_assigned", queue_to_fetch_from).Info("The queue being fetched from")
	c := colly.NewCollector(
		colly.AllowURLRevisit(),
	)

	for {
		timestamp.Mutex.RLock()
		current_bloom_filter_name := timestamp.Timestamp
		timestamp.Mutex.RUnlock()
		values, err := rdb.BRPop(context.Background(), 0, queue_to_fetch_from).Result()
		helpers.Assert(err == nil, fmt.Sprintf("Issue talking to redis, got an error\n %v", err))
		url_to_crawl := values[1]
		log.WithFields(log.Fields{
			"url": url_to_crawl,
		}).Info("Currently crawling")
		exists, err := rdb.BFExists(context.Background(), fmt.Sprintf("%v", current_bloom_filter_name), url_to_crawl).Result()
		helpers.Assert(err == nil, fmt.Sprintf("Issue talking to redis bloom filters %v", err))
		if !exists {
			newUUID := uuid.New()
			new_urls_to_crawl := Crawl(url_to_crawl, c, newUUID, strconv.FormatInt(current_bloom_filter_name, 10))
			rdb.BFAdd(context.Background(), fmt.Sprintf("%v", current_bloom_filter_name), url_to_crawl)
			new_row_created, err := conn.CreateUrl(context.Background(), database.CreateUrlParams{
				ID:            newUUID,
				Url:           url_to_crawl,
				Lastcrawledat: time.Now().Unix(),
			})
			if err != nil {
				log.WithFields(log.Fields{
					"error": err,
				}).Error("Issue talking to the database while inserting new url into the database")
			} else {
				log.WithFields(log.Fields{
					"row": new_row_created,
				}).Info("Added a new row into the database")
			}
			add_to_queue(new_urls_to_crawl, rdb, number_of_queues)
		} else {
			log.WithFields(log.Fields{
				"url": url_to_crawl,
			}).Info("Already crawled skip")
		}
	}
}
