
import { ScoutingReportResult } from "@/app/server/scouting/types";

export interface SavedReport {
  id: string;
  timestamp: number;
  teamName: string;
  opponentName: string;
  title: string;
  data: any; // Full report data
}

const STORAGE_KEY = "scoutiq_report_history";
const MAX_HISTORY = 10;

export function saveReportToHistory(reportData: any) {
  if (typeof window === "undefined") return;

  try {
    const history = getReportHistory();
    
    const newReport: SavedReport = {
      id: reportData.report.meta.generatedAt || new Date().toISOString(),
      timestamp: Date.now(),
      teamName: reportData.report.meta.ownTeam?.name || "Your Team",
      opponentName: reportData.report.meta.opponentTeam.name || "Opponent",
      title: reportData.report.meta.titleName,
      data: reportData,
    };

    // Remove duplicates (by team names + title combo or just ID)
    const filteredHistory = history.filter(h => h.id !== newReport.id);
    
    const updatedHistory = [newReport, ...filteredHistory].slice(0, MAX_HISTORY);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save report to history:", error);
  }
}

export function getReportHistory(): SavedReport[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load report history:", error);
    return [];
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
