package types

import "sync"

type TimeStamp struct {
	Timestamp int64
	Mutex     sync.RWMutex
}
