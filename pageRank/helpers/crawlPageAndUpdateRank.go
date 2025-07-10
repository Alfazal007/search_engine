package helpers

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"pageRanker/internal/database"
	"strconv"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/redis/go-redis/v9"
)

type RandomOrNot int

const (
	RandomUrlNext RandomOrNot = iota
	NoRandomUrlNext
)

func CrawlPage(url string, damping_factor int32, context context.Context, redis *redis.Client, conn *database.Queries) {
	for {
		randomUrlShouldBeCrawled := getRandomNumber(damping_factor)
		if randomUrlShouldBeCrawled == RandomUrlNext {
			// no need to update the page rank as next would be random
			url = GetRandomUrl(conn, context).Url
		} else {
			resp, err := http.Get(url)
			if err != nil {
				url = GetRandomUrl(conn, context).Url
				continue
			}

			doc, err := goquery.NewDocumentFromReader(resp.Body)
			if err != nil {
				url = GetRandomUrl(conn, context).Url
				resp.Body.Close()
				continue
			}

			links := []string{}
			doc.Find("a").Each(func(i int, s *goquery.Selection) {
				href, exists := s.Attr("href")
				if exists {
					links = append(links, href)
				}
			})
			resp.Body.Close()

			if len(links) == 0 {
				url = GetRandomUrl(conn, context).Url
			} else {
				randomNumberLinkIndex := rand.Intn(len(links))
				linkToUpdate := links[randomNumberLinkIndex]
				updatePageRank(linkToUpdate, redis, context)
				url = linkToUpdate
			}
		}
	}
}

func updatePageRank(url string, redis *redis.Client, context context.Context) {
	prevRank := redis.Get(context, fmt.Sprintf("PAGERANK:%v", url))
	new_rank := 1
	if prevRank != nil && prevRank.Val() != "" {
		new_rank_from_redis, err := strconv.Atoi(prevRank.Val())
		if err != nil {
			log.Fatal("Issue getting previous page rank from redis")
		}
		new_rank = new_rank_from_redis + 1
	}
	redis.Set(context, fmt.Sprintf("PAGERANK:%v", url), new_rank, time.Hour*1)
}

func getRandomNumber(damping_factor int32) RandomOrNot {
	randomNumber := rand.Intn(100) + 1
	if randomNumber <= int(damping_factor) {
		return RandomUrlNext
	}
	return NoRandomUrlNext
}
