import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
  time: string | undefined
  setTime: (time: string) => void
  className?: string
}

export function TimePicker({ time, setTime, className }: TimePickerProps) {
  // Generate time options in 30-minute intervals
  const timeOptions = React.useMemo(() => {
    const options: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const period = hour >= 12 ? 'PM' : 'AM'
      
      options.push(`${displayHour}:00 ${period}`)
      options.push(`${displayHour}:30 ${period}`)
    }
    return options
  }, [])
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? time : <span>Select time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col max-h-80 overflow-y-auto p-2 scrollbar-thin">
          {timeOptions.map((option) => (
            <Button
              key={option}
              variant="ghost"
              onClick={() => setTime(option)}
              className={cn(
                "justify-start px-2 py-1.5 text-left font-normal",
                time === option && "bg-accent text-accent-foreground"
              )}
            >
              {option}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
