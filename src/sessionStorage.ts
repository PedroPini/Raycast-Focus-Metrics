import { LocalStorage } from "@raycast/api";
import type { Session, SessionStats } from "./types";

const SESSIONS_KEY = "focus-sessions";

/**
 * Load all sessions from local storage
 */
export const loadSessions = async (): Promise<Session[]> => {
	try {
		const sessionsJson = await LocalStorage.getItem<string>(SESSIONS_KEY);
		if (!sessionsJson) {
			return [];
		}
		return JSON.parse(sessionsJson) as Session[];
	} catch (error) {
		console.error("Error loading sessions:", error);
		return [];
	}
};

/**
 * Save sessions to local storage
 */
export const saveSessions = async (sessions: Session[]): Promise<void> => {
	try {
		await LocalStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
	} catch (error) {
		console.error("Error saving sessions:", error);
		throw error;
	}
};

/**
 * Add a new session to storage
 */
export const addSession = async (session: Session): Promise<void> => {
	const sessions = await loadSessions();
	sessions.push(session);
	await saveSessions(sessions);
};

/**
 * Update an existing session
 */
export const updateSession = async (
	sessionId: string,
	updates: Partial<Session>,
): Promise<void> => {
	const sessions = await loadSessions();
	const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

	if (sessionIndex === -1) {
		throw new Error(`Session with id ${sessionId} not found`);
	}

	sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
	await saveSessions(sessions);
};

/**
 * Remove a session
 */
export const removeSession = async (sessionId: string): Promise<void> => {
	const sessions = await loadSessions();
	const filteredSessions = sessions.filter((s) => s.id !== sessionId);
	await saveSessions(filteredSessions);
};

/**
 * Get session statistics grouped by tag
 */
export const getSessionStats = async (): Promise<SessionStats[]> => {
	const sessions = await loadSessions();
	const statsMap = new Map<string, SessionStats>();

	sessions.forEach((session) => {
		const existing = statsMap.get(session.tag);
		const duration = session.duration || 0;

		if (existing) {
			existing.totalDuration += duration;
			existing.count += 1;
			existing.sessions.push(session);
		} else {
			statsMap.set(session.tag, {
				tag: session.tag,
				totalDuration: duration,
				count: 1,
				sessions: [session],
			});
		}
	});

	return Array.from(statsMap.values()).sort(
		(a, b) => b.totalDuration - a.totalDuration,
	);
};

/**
 * Mark a session as completed
 */
export const markSessionCompleted = async (
	sessionId: string,
): Promise<void> => {
	await updateSession(sessionId, {
		status: "completed",
		endTime: Date.now(),
	});
};
