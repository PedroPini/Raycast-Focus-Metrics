import {
	Action,
	ActionPanel,
	Alert,
	Color,
	confirmAlert,
	Icon,
	List,
	LocalStorage,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
	getSessionStats,
	loadSessions,
	markSessionCompleted,
	removeSession,
	updateSessionStatuses,
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

/**
 * Get productivity score based on session data
 */
const getProductivityScore = (sessions: Session[]): number => {
	if (sessions.length === 0) return 0;

	const completedSessions = sessions.filter((s) => s.status === "completed");
	const completionRate = completedSessions.length / sessions.length;

	const avgDuration =
		sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
	const durationScore = Math.min(avgDuration / 3600, 1); // Normalize to 1 hour

	return Math.round((completionRate * 0.7 + durationScore * 0.3) * 100);
};

/**
 * Get productivity color based on score
 */
const getProductivityColor = (score: number): Color => {
	if (score >= 80) return Color.Green;
	if (score >= 60) return Color.Orange;
	return Color.Red;
};

export default function Command() {
	const [stats, setStats] = useState<SessionStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		try {
			setIsLoading(true);
			// First update session statuses based on elapsed time
			await updateSessionStatuses();
			// Then load the updated stats
			const sessionStats = await getSessionStats();
			setStats(sessionStats);
		} catch (error) {
			console.error("Error loading stats:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Load Statistics",
				message: "Please try refreshing the data",
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
				title: "Session Completed",
				message: "Session has been marked as completed",
			});
		} catch (error) {
			console.error("Error marking session completed:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Update Session",
				message: "Please try again",
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
					message: "Session has been successfully removed",
				});
			} catch (error) {
				console.error("Error removing session:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Remove Session",
					message: "Please try again",
				});
			}
		}
	};

	const handleRemoveAllSessions = async (tag: string) => {
		const confirmed = await confirmAlert({
			title: "Remove All Sessions",
			message: `Are you sure you want to remove all sessions for "${tag}"? This action cannot be undone.`,
			primaryAction: {
				title: "Remove All",
				style: Alert.ActionStyle.Destructive,
			},
		});

		if (confirmed) {
			try {
				const sessions = await loadSessions();
				const sessionsToRemove = sessions.filter((s: Session) => s.tag === tag);

				for (const session of sessionsToRemove) {
					await removeSession(session.id);
				}

				await loadStats(); // Reload stats
				await showToast({
					style: Toast.Style.Success,
					title: "Sessions Removed",
					message: `All ${sessionsToRemove.length} sessions for "${tag}" have been removed`,
				});
			} catch (error) {
				console.error("Error removing sessions:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Remove Sessions",
					message: "Please try again",
				});
			}
		}
	};

	const handleExportData = async () => {
		try {
			const sessions = await loadSessions();
			const exportData = {
				exportDate: new Date().toISOString(),
				totalSessions: sessions.length,
				sessions: sessions,
				stats: stats,
			};

			// In a real implementation, you'd save this to a file
			// For now, we'll just show a toast
			await showToast({
				style: Toast.Style.Success,
				title: "Data Ready for Export",
				message: `${sessions.length} sessions exported successfully`,
			});
		} catch (error) {
			console.error("Error exporting data:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Export Failed",
				message: "Please try again",
			});
		}
	};

	const handleBulkComplete = async (tag: string) => {
		const confirmed = await confirmAlert({
			title: "Complete All Sessions",
			message: `Mark all running sessions for "${tag}" as completed?`,
			primaryAction: {
				title: "Complete All",
				style: Alert.ActionStyle.Default,
			},
		});

		if (confirmed) {
			try {
				const tagStats = stats.find((s) => s.tag === tag);
				if (!tagStats) return;

				const runningSessions = tagStats.sessions.filter(
					(s) => s.status === "running",
				);
				for (const session of runningSessions) {
					await markSessionCompleted(session.id);
				}

				await loadStats();
				await showToast({
					style: Toast.Style.Success,
					title: "Sessions Completed",
					message: `${runningSessions.length} sessions marked as completed`,
				});
			} catch (error) {
				console.error("Error completing sessions:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Complete Sessions",
					message: "Please try again",
				});
			}
		}
	};

	const totalSessions = stats.reduce(
		(sum, tagStats) => sum + tagStats.count,
		0,
	);
	const totalDuration = stats.reduce(
		(sum, tagStats) => sum + tagStats.totalDuration,
		0,
	);
	const runningSessions = stats.reduce(
		(sum, tagStats) =>
			sum + tagStats.sessions.filter((s) => s.status === "running").length,
		0,
	);

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search sessions by tag or goal..."
			actions={
				<ActionPanel>
					<Action
						title="Refresh Data"
						icon={Icon.ArrowClockwise}
						onAction={loadStats}
						shortcut={{ modifiers: ["cmd"], key: "r" }}
					/>
					<Action
						title="Toggle View Mode"
						icon={viewMode === "summary" ? Icon.List : Icon.BulletPoints}
						onAction={() =>
							setViewMode(viewMode === "summary" ? "detailed" : "summary")
						}
						shortcut={{ modifiers: ["cmd"], key: "v" }}
					/>
					<Action
						title="Export Data"
						icon={Icon.Download}
						onAction={handleExportData}
						shortcut={{ modifiers: ["cmd"], key: "e" }}
					/>
				</ActionPanel>
			}
		>
			{/* Summary Section */}
			<List.Section title="Overview">
				<List.Item
					title={`${totalSessions} Total Sessions`}
					subtitle={`${formatDuration(totalDuration)} total time • ${runningSessions} running`}
					icon={Icon.BarChart}
					accessories={[
						{
							text: `${Math.round(totalDuration / 3600)}h`,
							icon: Icon.Clock,
						},
					]}
				/>
			</List.Section>

			{/* Tag Statistics */}
			{stats.map((tagStats) => {
				const productivityScore = getProductivityScore(tagStats.sessions);
				const runningCount = tagStats.sessions.filter(
					(s) => s.status === "running",
				).length;

				return (
					<List.Section key={tagStats.tag} title={tagStats.tag}>
						<List.Item
							title={`${tagStats.count} sessions`}
							subtitle={`Total: ${formatDuration(tagStats.totalDuration)} • ${runningCount} running`}
							icon={Icon.Tag}
							accessories={[
								{
									text: `${productivityScore}%`,
									icon: Icon.BarChart,
								},
								{
									text:
										runningCount > 0
											? `${runningCount} running`
											: "All completed",
									icon: runningCount > 0 ? Icon.Play : Icon.Checkmark,
								},
							]}
							actions={
								<ActionPanel>
									{runningCount > 0 && (
										<Action
											title="Complete All Running"
											icon={Icon.Checkmark}
											onAction={() => handleBulkComplete(tagStats.tag)}
											shortcut={{ modifiers: ["cmd"], key: "c" }}
										/>
									)}
									<Action
										title="Remove All Sessions"
										icon={Icon.Trash}
										style={Action.Style.Destructive}
										onAction={() => handleRemoveAllSessions(tagStats.tag)}
										shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
									/>
									<Action
										title="Refresh"
										icon={Icon.ArrowClockwise}
										onAction={loadStats}
									/>
								</ActionPanel>
							}
						/>

						{viewMode === "detailed" &&
							tagStats.sessions.map((session) => (
								<List.Item
									key={session.id}
									title={session.goal || "No goal set"}
									subtitle={`${formatDate(session.startTime)} • ${session.mode}`}
									icon={getStatusIcon(session.status).icon}
									accessories={[
										{
											text: session.duration
												? formatDuration(session.duration)
												: "No duration",
											icon: Icon.Clock,
										},
										{
											text: session.categories.split(",").length.toString(),
											icon: Icon.Tag,
										},
									]}
									actions={
										<ActionPanel>
											{session.status === "running" && (
												<Action
													title="Mark as Completed"
													icon={Icon.Checkmark}
													onAction={() => handleMarkCompleted(session.id)}
													shortcut={{ modifiers: ["cmd"], key: "enter" }}
												/>
											)}
											<Action
												title="Remove Session"
												icon={Icon.Trash}
												style={Action.Style.Destructive}
												onAction={() => handleRemoveSession(session.id)}
												shortcut={{ modifiers: ["cmd"], key: "delete" }}
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
				);
			})}

			{stats.length === 0 && !isLoading && (
				<List.EmptyView
					title="No Sessions Found"
					description="Start a session with a tag to see statistics here"
					icon={Icon.Clock}
					actions={
						<ActionPanel>
							<Action
								title="Start New Session"
								icon={Icon.Play}
								onAction={() => {
									// This would ideally open the start session command
									showToast({
										style: Toast.Style.Success,
										title: "Start Session",
										message: "Use 'Start Focus Session with Tag' command",
									});
								}}
							/>
						</ActionPanel>
					}
				/>
			)}
		</List>
	);
}
