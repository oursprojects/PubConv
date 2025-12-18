"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const today = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Navigate months
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Check if date is today
    const isToday = (day: number) => {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    // Check if date is selected
    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()
        );
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const days = [];

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                isCurrentMonth: false,
                isPrevMonth: true,
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                isPrevMonth: false,
            });
        }

        // Next month days to fill the grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                isPrevMonth: false,
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="flex flex-col h-full w-full max-w-lg mx-auto p-4 overflow-auto animate-in fade-in-0 duration-300">
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-3xl shadow-xl">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold font-poppins flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Calendar
                        </CardTitle>
                        <AnimatedButton
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="text-xs"
                        >
                            Today
                        </AnimatedButton>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <AnimatedButton
                            variant="ghost"
                            size="icon"
                            onClick={goToPrevMonth}
                            className="h-8 w-8 rounded-xl"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </AnimatedButton>
                        <h2 className="text-lg font-semibold font-poppins">
                            {MONTHS[currentMonth]} {currentYear}
                        </h2>
                        <AnimatedButton
                            variant="ghost"
                            size="icon"
                            onClick={goToNextMonth}
                            className="h-8 w-8 rounded-xl"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </AnimatedButton>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-medium text-muted-foreground py-2"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((dateObj, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (dateObj.isCurrentMonth) {
                                        setSelectedDate(new Date(currentYear, currentMonth, dateObj.day));
                                    }
                                }}
                                disabled={!dateObj.isCurrentMonth}
                                className={cn(
                                    "h-10 w-full rounded-xl text-sm font-medium transition-all duration-200",
                                    dateObj.isCurrentMonth
                                        ? "hover:bg-muted cursor-pointer"
                                        : "text-muted-foreground/40 cursor-default",
                                    isToday(dateObj.day) && dateObj.isCurrentMonth &&
                                    "bg-primary text-primary-foreground hover:bg-primary/90",
                                    isSelected(dateObj.day) && dateObj.isCurrentMonth && !isToday(dateObj.day) &&
                                    "bg-muted ring-2 ring-primary/50"
                                )}
                            >
                                {dateObj.day}
                            </button>
                        ))}
                    </div>

                    {/* Selected Date Display */}
                    {selectedDate && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-xl text-center">
                            <p className="text-sm text-muted-foreground">Selected Date</p>
                            <p className="text-lg font-semibold font-poppins">
                                {selectedDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
