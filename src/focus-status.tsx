import {
	Color,
	Icon,
	MenuBarExtra,
	open,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
	loadSessions,
	markSessionCompleted,
	updateSessionStatuses,
} from "./sessionStorage";
import type { Session } from "./types";

export default function Command() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadSessionsData();

		// Set up periodic refresh every 30 seconds
		const interval = setInterval(loadSessionsData, 30000);

		return () => clearInterval(interval);
	}, []);

	const loadSessionsData = async () => {
		try {
			setIsLoading(true);
			// Update session statuses first
			await updateSessionStatuses();
			// Then load sessions
			const allSessions = await loadSessions();
			const runningSessions = allSessions.filter(
				(session: Session) => session.status === "running",
			);
			setSessions(runningSessions);
		} catch (error) {
			console.error("Error loading sessions:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const formatDuration = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	const getElapsedTime = (startTime: number): string => {
		const now = Date.now();
		const elapsedMs = now - startTime;
		const elapsedSeconds = Math.floor(elapsedMs / 1000);
		return formatDuration(elapsedSeconds);
	};

	const getRemainingTime = (startTime: number, duration?: number): string => {
		if (!duration) return "No limit";

		const now = Date.now();
		const elapsedMs = now - startTime;
		const remainingMs = duration * 1000 - elapsedMs;

		if (remainingMs <= 0) return "Time's up!";

		const remainingSeconds = Math.floor(remainingMs / 1000);
		return formatDuration(remainingSeconds);
	};

	const handleCompleteSession = async (sessionId: string) => {
		try {
			await markSessionCompleted(sessionId);
			await loadSessionsData();
			await showToast({
				style: Toast.Style.Success,
				title: "Session Completed",
				message: "Focus session marked as completed",
			});
		} catch (error) {
			console.error("Error completing session:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Complete Session",
				message: "Please try again",
			});
		}
	};

	const handleOpenStats = async () => {
		try {
			await open("raycast://extensions/pedropini/focus/view-session-stats");
		} catch (error) {
			console.error("Error opening stats:", error);
		}
	};

	const handleStartNewSession = async () => {
		try {
			await open("raycast://extensions/pedropini/focus/start-session-with-tag");
		} catch (error) {
			console.error("Error opening start session:", error);
		}
	};

	if (isLoading) {
		return <MenuBarExtra icon={Icon.Clock} isLoading={true} />;
	}

	if (sessions.length === 0) {
		return (
			<MenuBarExtra icon={Icon.Clock} title="No active sessions">
				<MenuBarExtra.Item title="No focus sessions running" icon={Icon.Info} />
				<MenuBarExtra.Separator />
				<MenuBarExtra.Item
					title="Start New Session"
					icon={Icon.Play}
					onAction={handleStartNewSession}
				/>
				<MenuBarExtra.Item
					title="View Statistics"
					icon={Icon.BarChart}
					onAction={handleOpenStats}
				/>
				<MenuBarExtra.Separator />
				<MenuBarExtra.Item
					title="Refresh"
					icon={Icon.ArrowClockwise}
					onAction={loadSessionsData}
				/>
			</MenuBarExtra>
		);
	}

	const totalElapsed = sessions.reduce((sum, session) => {
		const elapsedMs = Date.now() - session.startTime;
		return sum + Math.floor(elapsedMs / 1000);
	}, 0);

	return (
		<MenuBarExtra
			icon={Icon.Clock}
			title={`${sessions.length} active session${sessions.length !== 1 ? "s" : ""} • ${formatDuration(totalElapsed)}`}
		>
			<MenuBarExtra.Item
				title={`${sessions.length} Active Session${sessions.length !== 1 ? "s" : ""}`}
				subtitle={`Total: ${formatDuration(totalElapsed)}`}
				icon={Icon.Play}
			/>
			<MenuBarExtra.Separator />

			{sessions.map((session) => (
				<MenuBarExtra.Item
					key={session.id}
					title={session.goal || "No goal set"}
					subtitle={`${session.tag} • ${getElapsedTime(session.startTime)} elapsed`}
					icon={{ source: Icon.Play, tintColor: Color.Green }}
				/>
			))}

			<MenuBarExtra.Separator />
			<MenuBarExtra.Item
				title="Start New Session"
				icon={Icon.Play}
				onAction={handleStartNewSession}
			/>
			<MenuBarExtra.Item
				title="View Statistics"
				icon={Icon.BarChart}
				onAction={handleOpenStats}
			/>
			<MenuBarExtra.Separator />
			<MenuBarExtra.Item
				title="Refresh"
				icon={Icon.ArrowClockwise}
				onAction={loadSessionsData}
			/>
		</MenuBarExtra>
	);
}
