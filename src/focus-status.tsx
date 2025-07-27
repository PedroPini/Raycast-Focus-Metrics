import { Color, Icon, MenuBarExtra } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadSessions, updateSessionStatuses } from "./sessionStorage";
import type { Session } from "./types";

export default function Command() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadSessionsData();
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

	if (isLoading) {
		return <MenuBarExtra icon={Icon.Clock} isLoading={true} />;
	}

	if (sessions.length === 0) {
		return (
			<MenuBarExtra icon={Icon.Clock} title="No active sessions">
				<MenuBarExtra.Item title="No focus sessions running" icon={Icon.Info} />
			</MenuBarExtra>
		);
	}

	return (
		<MenuBarExtra
			icon={Icon.Clock}
			title={`${sessions.length} active session${sessions.length !== 1 ? "s" : ""}`}
		>
			{sessions.map((session) => (
				<MenuBarExtra.Item
					key={session.id}
					title={session.goal || "No goal set"}
					subtitle={`${session.tag} • ${getElapsedTime(session.startTime)}`}
					icon={{ source: Icon.Play, tintColor: Color.Green }}
				/>
			))}
			<MenuBarExtra.Separator />
			<MenuBarExtra.Item
				title="Refresh"
				icon={Icon.ArrowClockwise}
				onAction={loadSessionsData}
			/>
		</MenuBarExtra>
	);
}
