package crawl

import (
	"context"
	"fmt"
	"hash/fnv"
	"net/url"
	"webcrawler/helpers"

	"github.com/redis/go-redis/v9"
)

func add_to_queue(new_urls_to_crawl []string, rdb *redis.Client, number_of_queues int32) {
	for _, single_url := range new_urls_to_crawl {
		url, err := url.Parse(single_url)
		helpers.Assert(err == nil, fmt.Sprintf("Issue parsing the url %v", err))
		queue_to_add_in := hashURLToRange(url.Hostname(), number_of_queues)
		rdb.LPush(context.Background(), fmt.Sprintf("url_queue_%v", queue_to_add_in), url)
	}
}

func hashURLToRange(url string, max int32) int {
	h := fnv.New32a()
	h.Write([]byte(url))
	hash := h.Sum32()
	return int(hash % uint32(max))
}
