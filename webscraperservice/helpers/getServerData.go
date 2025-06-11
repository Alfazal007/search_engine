package helpers

import (
	"fmt"
)

func GetServerData() (int32, int32) {
	var number_of_queues, my_position int32
	fmt.Print("Enter the number of servers: ")
	fmt.Scanln(&number_of_queues)
	Assert(number_of_queues > 0, "The number of queue should be greater than 0")
	fmt.Print("Enter the position of this server: ")
	fmt.Scanln(&my_position)
	Assert(my_position >= 0, "My position should be greater than 0")
	Assert(my_position < number_of_queues, "My position should be less than or equal to number of queues")
	return number_of_queues, my_position
}
