package crawl

import (
	"fmt"
	"os"
	"strings"

	"github.com/gocolly/colly"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

func Crawl(url string, base_colly *colly.Collector, id uuid.UUID, timestamp_folder string) []string {
	c := base_colly.Clone()
	urls_to_add_to_queue := []string{}
	c.OnHTML("a", func(e *colly.HTMLElement) {
		link := e.Attr("href")
		if strings.Contains(link, "https://") {
			urls_to_add_to_queue = append(urls_to_add_to_queue, link)
		}
	})

	c.OnResponse(func(r *colly.Response) {
		log.Info("Saving URL ", url)
		filename := fmt.Sprintf("savedPages/%v/%v.html", timestamp_folder, id.String())
		err := os.WriteFile(filename, r.Body, 0644)
		if err != nil {
			log.Error("Error saving HTML: ", err)
		} else {
			log.Info("HTML saved to", filename)
		}
	})

	err := c.Visit(url)
	if err != nil {
		log.WithFields(log.Fields{
			"url":   url,
			"error": err.Error(),
		}).Error("Issue scraping")
		return []string{}
	}
	return urls_to_add_to_queue
}
