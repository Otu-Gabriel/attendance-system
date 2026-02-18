"use client";

import Button from "@/components/ui/Button";
import { Calendar } from "lucide-react";

interface QuickFiltersProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export default function QuickFilters({
  onFilterChange,
  currentStartDate,
  currentEndDate,
}: QuickFiltersProps) {
  const setQuickFilter = (period: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = "";
    let endDate = today.toISOString().split("T")[0];

    switch (period) {
      case "today":
        startDate = endDate;
        break;
      case "thisWeek":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split("T")[0];
        break;
      case "thisMonth":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonthStart.toISOString().split("T")[0];
        endDate = lastMonthEnd.toISOString().split("T")[0];
        break;
      case "last7Days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        startDate = sevenDaysAgo.toISOString().split("T")[0];
        break;
      case "last30Days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split("T")[0];
        break;
      case "all":
        startDate = "";
        endDate = "";
        break;
    }

    onFilterChange(startDate, endDate);
  };

  const isActive = (period: string) => {
    if (!currentStartDate && !currentEndDate && period === "all") return true;
    // Simple check - can be enhanced
    return false;
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={isActive("today") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("today")}
      >
        Today
      </Button>
      <Button
        variant={isActive("thisWeek") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("thisWeek")}
      >
        This Week
      </Button>
      <Button
        variant={isActive("thisMonth") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("thisMonth")}
      >
        This Month
      </Button>
      <Button
        variant={isActive("lastMonth") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("lastMonth")}
      >
        Last Month
      </Button>
      <Button
        variant={isActive("last7Days") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("last7Days")}
      >
        Last 7 Days
      </Button>
      <Button
        variant={isActive("last30Days") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("last30Days")}
      >
        Last 30 Days
      </Button>
      <Button
        variant={isActive("all") ? "default" : "outline"}
        size="sm"
        onClick={() => setQuickFilter("all")}
      >
        All Time
      </Button>
    </div>
  );
}
