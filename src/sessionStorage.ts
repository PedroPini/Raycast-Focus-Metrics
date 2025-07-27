import { getApplications, LocalStorage } from "@raycast/api";
import type { Session, SessionStats } from "./types";

const SESSIONS_KEY = "focus-sessions";
const TAGS_KEY = "focus-tags";

/**
 * Check if Focus app is currently running a session
 */
export const isFocusRunning = async (): Promise<boolean> => {
	try {
		const applications = await getApplications();
		const focusApp = applications.find(
			(app) =>
				app.name.toLowerCase().includes("focus") ||
				app.bundleId?.toLowerCase().includes("focus"),
		);

		// If Focus app is found, assume it might be running
		// Note: Raycast API doesn't provide direct running status
		return !!focusApp;
	} catch (error) {
		console.error("Error checking Focus app status:", error);
		return false;
	}
};

/**
 * Update session status based on time elapsed
 */
export const updateSessionStatuses = async (): Promise<void> => {
	try {
		const sessions = await loadSessions();
		const now = Date.now();

		const updatedSessions = sessions.map((session) => {
			// If session has a duration and has been running longer than the duration, mark as completed
			if (session.status === "running" && session.duration) {
				const elapsedTime = now - session.startTime;
				const sessionDurationMs = session.duration * 1000; // Convert seconds to milliseconds

				if (elapsedTime >= sessionDurationMs) {
					return {
						...session,
						status: "completed" as const,
						endTime: session.startTime + sessionDurationMs,
					};
				}
			}
			return session;
		});

		await saveSessions(updatedSessions);
	} catch (error) {
		console.error("Error updating session statuses:", error);
	}
};

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

/**
 * Load all stored tags
 */
export const loadTags = async (): Promise<string[]> => {
	try {
		const tagsJson = await LocalStorage.getItem<string>(TAGS_KEY);
		if (!tagsJson) {
			return [];
		}
		return JSON.parse(tagsJson) as string[];
	} catch (error) {
		console.error("Error loading tags:", error);
		return [];
	}
};

/**
 * Save tags to local storage
 */
export const saveTags = async (tags: string[]): Promise<void> => {
	try {
		await LocalStorage.setItem(TAGS_KEY, JSON.stringify(tags));
	} catch (error) {
		console.error("Error saving tags:", error);
		throw error;
	}
};

/**
 * Get all unique tags from stored tags and existing sessions
 */
export const getAllTags = async (): Promise<string[]> => {
	const storedTags = await loadTags();
	const sessions = await loadSessions();
	const sessionTags = new Set<string>();

	sessions.forEach((session) => {
		if (session.tag) {
			sessionTags.add(session.tag);
		}
	});

	// Combine stored tags with session tags
	const allTags = new Set([...storedTags, ...sessionTags]);
	return Array.from(allTags).sort();
};

/**
 * Add a new tag to the list of available tags
 */
export const addTag = async (tag: string): Promise<void> => {
	const tags = await loadTags();
	if (!tags.includes(tag)) {
		tags.push(tag);
		await saveTags(tags);
	}
};

/**
 * Remove a tag from all sessions and stored tags
 */
export const removeTag = async (tagName: string): Promise<void> => {
	try {
		// Remove from stored tags
		const storedTags = await loadTags();
		const updatedStoredTags = storedTags.filter((tag) => tag !== tagName);
		await saveTags(updatedStoredTags);

		// Remove from sessions
		const sessions = await loadSessions();
		const updatedSessions = sessions.map((session) =>
			session.tag === tagName ? { ...session, tag: "" } : session,
		);

		await saveSessions(updatedSessions);
	} catch (error) {
		console.error("Error removing tag:", error);
		throw error;
	}
};
