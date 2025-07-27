import {
	Action,
	ActionPanel,
	Alert,
	Color,
	confirmAlert,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
	getSessionStats,
	markSessionCompleted,
	removeSession,
} from "./sessionStorage";
import type { Session, SessionStats } from "./types";

/**
 * Format duration from seconds to human readable format
 */
const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
};

/**
 * Format timestamp to readable date
 */
const formatDate = (timestamp: number): string => {
	return new Date(timestamp).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Get status icon and color
 */
const getStatusIcon = (status: Session["status"]) => {
	if (status === "running") {
		return { icon: Icon.Play, color: Color.Green };
	}
	return { icon: Icon.Checkmark, color: Color.Blue };
};

export default function Command() {
	const [stats, setStats] = useState<SessionStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		try {
			setIsLoading(true);
			const sessionStats = await getSessionStats();
			setStats(sessionStats);
		} catch (error) {
			console.error("Error loading stats:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Load Statistics",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleMarkCompleted = async (sessionId: string) => {
		try {
			await markSessionCompleted(sessionId);
			await loadStats(); // Reload stats
			await showToast({
				style: Toast.Style.Success,
				title: "Session Marked as Completed",
			});
		} catch (error) {
			console.error("Error marking session completed:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Update Session",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	};

	const handleRemoveSession = async (sessionId: string) => {
		const confirmed = await confirmAlert({
			title: "Remove Session",
			message:
				"Are you sure you want to remove this session? This action cannot be undone.",
			primaryAction: {
				title: "Remove",
				style: Alert.ActionStyle.Destructive,
			},
		});

		if (confirmed) {
			try {
				await removeSession(sessionId);
				await loadStats(); // Reload stats
				await showToast({
					style: Toast.Style.Success,
					title: "Session Removed",
				});
			} catch (error) {
				console.error("Error removing session:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Remove Session",
					message:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			}
		}
	};

	const handleRemoveAllSessions = async (tag: string) => {
		const confirmed = await confirmAlert({
			title: "Remove All Sessions",
			message: `Are you sure you want to remove all sessions with tag "${tag}"? This action cannot be undone.`,
			primaryAction: {
				title: "Remove All",
				style: Alert.ActionStyle.Destructive,
			},
		});

		if (confirmed) {
			try {
				const tagStats = stats.find((s) => s.tag === tag);
				if (tagStats) {
					for (const session of tagStats.sessions) {
						await removeSession(session.id);
					}
					await loadStats(); // Reload stats
					await showToast({
						style: Toast.Style.Success,
						title: "All Sessions Removed",
						message: `Removed ${tagStats.sessions.length} sessions`,
					});
				}
			} catch (error) {
				console.error("Error removing sessions:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Remove Sessions",
					message:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			}
		}
	};

	return (
		<List isLoading={isLoading}>
			{stats.map((tagStats) => (
				<List.Section key={tagStats.tag} title={tagStats.tag}>
					<List.Item
						title={`${tagStats.count} sessions`}
						subtitle={`Total: ${formatDuration(tagStats.totalDuration)}`}
						icon={Icon.Tag}
						accessories={[
							{
								text: `${tagStats.sessions.filter((s) => s.status === "running").length} running`,
							},
						]}
						actions={
							<ActionPanel>
								<Action
									title="Remove All Sessions"
									icon={Icon.Trash}
									style={Action.Style.Destructive}
									onAction={() => handleRemoveAllSessions(tagStats.tag)}
								/>
								<Action
									title="Refresh"
									icon={Icon.ArrowClockwise}
									onAction={loadStats}
								/>
							</ActionPanel>
						}
					/>

					{tagStats.sessions.map((session) => (
						<List.Item
							key={session.id}
							title={session.goal || "No goal set"}
							subtitle={`${session.categories} • ${formatDate(session.startTime)}`}
							icon={getStatusIcon(session.status).icon}
							accessories={[
								{
									text: session.duration
										? formatDuration(session.duration)
										: "No duration",
									icon: Icon.Clock,
								},
								{
									text: session.mode,
									icon: Icon.Gear,
								},
							]}
							actions={
								<ActionPanel>
									{session.status === "running" && (
										<Action
											title="Mark as Completed"
											icon={Icon.Checkmark}
											onAction={() => handleMarkCompleted(session.id)}
										/>
									)}
									<Action
										title="Remove Session"
										icon={Icon.Trash}
										style={Action.Style.Destructive}
										onAction={() => handleRemoveSession(session.id)}
									/>
									<Action
										title="Refresh"
										icon={Icon.ArrowClockwise}
										onAction={loadStats}
									/>
								</ActionPanel>
							}
						/>
					))}
				</List.Section>
			))}

			{stats.length === 0 && !isLoading && (
				<List.EmptyView
					title="No Sessions Found"
					description="Start a session with a tag to see statistics here"
					icon={Icon.Clock}
				/>
			)}
		</List>
	);
}
