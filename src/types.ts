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
