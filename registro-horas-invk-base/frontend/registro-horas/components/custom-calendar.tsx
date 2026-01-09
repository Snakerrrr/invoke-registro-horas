"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"

interface CustomCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function CustomCalendar({ selected, onSelect, className }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Get all days to display (including previous/next month days to fill the grid)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())

  const calendarEnd = new Date(monthEnd)
  const daysToAdd = 6 - monthEnd.getDay()
  calendarEnd.setDate(calendarEnd.getDate() + daysToAdd)

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    onSelect?.(date)
  }

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between text-white"
        style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div
        className="grid grid-cols-7 py-2"
        style={{ background: "linear-gradient(135deg, #004072 0%, #003a66 100%)" }}
      >
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-white/90 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isSelected = selected && isSameDay(date, selected)
            const isTodayDate = isToday(date)

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-10 w-10 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105
                  ${!isCurrentMonth ? "text-gray-400 hover:text-gray-600" : "text-gray-900 hover:bg-gray-100"}
                  ${isSelected ? "text-white shadow-lg transform scale-105" : ""}
                  ${isTodayDate && !isSelected ? "bg-gray-100 font-bold ring-2 ring-gray-300" : ""}
                `}
                style={
                  isSelected
                    ? {
                        background: "linear-gradient(135deg, #004072 0%, #003a66 100%)",
                      }
                    : {}
                }
              >
                {format(date, "d")}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
