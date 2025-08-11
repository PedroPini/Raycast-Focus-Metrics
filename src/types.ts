import type { Color, Icon } from "@raycast/api";
export interface SessionArguments {
  goal?: string;
  categories: string;
  duration?: string;
  mode?: string;
  tag: string;
}

export interface Session {
  id: string;
  tag: string;
  goal?: string;
  categories: string;
  duration?: number;
  mode: string;
  status: "running" | "completed";
  startTime: number;
  endTime?: number;
}

export interface SessionStats {
  tag: string;
  totalDuration: number;
  count: number;
  sessions: Session[];
}

export interface CustomAction {
  id: string;
  title: string;
  goal: string;
  duration: string;
  categories: string;
  tag: string;
  icon: Icon; // Raycast Icon type
  color: Color; // Raycast Color type
  isCustom?: boolean;
}

export interface DeeplinkArgs {
  goal?: string;
  categories?: string;
  duration?: string;
  mode?: string;
  tag?: string;
}

export interface UserPreferences {
  recentTags?: string[];
  defaultDuration?: string;
  defaultCategories?: string[];
}
