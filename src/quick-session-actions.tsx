import {
	Action,
	ActionPanel,
	Color,
	Icon,
	List,
	open,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { addSession, getAllTags } from "./sessionStorage";
import type { Session } from "./types";

// Quick action templates for instant session start
const QUICK_ACTIONS = [
	{
		id: "quick-coding",
		title: "Quick Coding",
		goal: "Write code",
		duration: "1800", // 30 minutes
		categories: "social,messaging,streaming,gaming",
		tag: "coding",
		icon: Icon.Code,
		color: Color.Blue,
	},
	{
		id: "quick-writing",
		title: "Quick Writing",
		goal: "Write content",
		duration: "1800", // 30 minutes
		categories: "social,messaging,streaming",
		tag: "writing",
		icon: Icon.Document,
		color: Color.Green,
	},
	{
		id: "quick-reading",
		title: "Quick Reading",
		goal: "Read and learn",
		duration: "1800", // 30 minutes
		categories: "social,messaging,streaming,gaming",
		tag: "reading",
		icon: Icon.Book,
		color: Color.Orange,
	},
	{
		id: "quick-meeting",
		title: "Meeting Prep",
		goal: "Prepare for meeting",
		duration: "900", // 15 minutes
		categories: "social,messaging,streaming",
		tag: "meeting",
		icon: Icon.Person,
		color: Color.Purple,
	},
	{
		id: "quick-planning",
		title: "Quick Planning",
		goal: "Plan tasks",
		duration: "1800", // 30 minutes
		categories: "social,messaging,streaming",
		tag: "planning",
		icon: Icon.Calendar,
		color: Color.Yellow,
	},
	{
		id: "deep-work",
		title: "Deep Work",
		goal: "Deep focus work",
		duration: "3600", // 1 hour
		categories: "social,messaging,streaming,gaming,news,shopping,entertainment",
		tag: "deep-work",
		icon: Icon.BullsEye,
		color: Color.Red,
	},
];

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
 * Build Focus deeplink URL with parameters
 */
const buildFocusDeeplink = (args: any): string => {
	const params = new URLSearchParams();

	if (args.goal) {
		params.append("goal", args.goal);
	}

	if (args.categories) {
		params.append("categories", args.categories);
	}

	if (args.duration) {
		params.append("duration", args.duration);
	}

	const mode = args.mode || "block";
	params.append("mode", mode);

	return `raycast://focus/start?${params.toString()}`;
};

/**
 * Create a new session record
 */
const createSession = (args: any): Session => {
	return {
		id: Date.now().toString(),
		tag: args.tag,
		goal: args.goal,
		categories: args.categories,
		duration: args.duration ? parseInt(args.duration, 10) : undefined,
		mode: args.mode || "block",
		status: "running",
		startTime: Date.now(),
	};
};

export default function Command() {
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [recentTags, setRecentTags] = useState<string[]>([]);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setIsLoading(true);
			const tags = await getAllTags();
			setAvailableTags(tags);

			// Get recent tags (last 5 used)
			const recent = tags.slice(0, 5);
			setRecentTags(recent);
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleQuickAction = async (action: (typeof QUICK_ACTIONS)[0]) => {
		try {
			// Create session record
			const session = createSession({
				goal: action.goal,
				duration: action.duration,
				mode: "block",
				categories: action.categories,
				tag: action.tag,
			});

			// Store session in local storage
			await addSession(session);

			// Build and trigger Focus deeplink
			const deeplink = buildFocusDeeplink({
				goal: action.goal,
				duration: action.duration,
				mode: "block",
				categories: action.categories,
				tag: action.tag,
			});
			await open(deeplink);

			// Show success toast
			const durationText = formatDuration(parseInt(action.duration, 10));
			await showToast({
				style: Toast.Style.Success,
				title: "Quick Session Started",
				message: `${action.title} - ${durationText}`,
			});
		} catch (error) {
			console.error("Error starting quick session:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Start Session",
				message: "Please try again",
			});
		}
	};

	const handleCustomSession = async (tag: string) => {
		try {
			await open(
				`raycast://extensions/pedropini/focus/start-session-with-tag?arguments={"tag":"${tag}"}`,
			);
		} catch (error) {
			console.error("Error opening custom session:", error);
		}
	};

	const handleViewStats = async () => {
		try {
			await open("raycast://extensions/pedropini/focus/view-session-stats");
		} catch (error) {
			console.error("Error opening stats:", error);
		}
	};

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search quick actions..."
			actions={
				<ActionPanel>
					<Action
						title="Refresh"
						icon={Icon.ArrowClockwise}
						onAction={loadData}
						shortcut={{ modifiers: ["cmd"], key: "r" }}
					/>
					<Action
						title="View Statistics"
						icon={Icon.BarChart}
						onAction={handleViewStats}
						shortcut={{ modifiers: ["cmd"], key: "s" }}
					/>
				</ActionPanel>
			}
		>
			{/* Quick Actions Section */}
			<List.Section title="Quick Actions">
				{QUICK_ACTIONS.map((action) => (
					<List.Item
						key={action.id}
						title={action.title}
						subtitle={`${action.goal} • ${formatDuration(parseInt(action.duration, 10))}`}
						icon={{ source: action.icon, tintColor: action.color }}
						accessories={[
							{
								text: action.categories.split(",").length.toString(),
								icon: Icon.Tag,
							},
						]}
						actions={
							<ActionPanel>
								<Action
									title={`Start ${action.title}`}
									icon={Icon.Play}
									onAction={() => handleQuickAction(action)}
									shortcut={{ modifiers: ["cmd"], key: "enter" }}
								/>
								<Action
									title="View Statistics"
									icon={Icon.BarChart}
									onAction={handleViewStats}
								/>
								<Action
									title="Refresh"
									icon={Icon.ArrowClockwise}
									onAction={loadData}
								/>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>

			{/* Recent Tags Section */}
			{recentTags.length > 0 && (
				<List.Section title="Recent Tags">
					{recentTags.map((tag) => (
						<List.Item
							key={tag}
							title={`Start ${tag} session`}
							subtitle="Customize duration and settings"
							icon={Icon.Tag}
							actions={
								<ActionPanel>
									<Action
										title={`Start ${tag} Session`}
										icon={Icon.Play}
										onAction={() => handleCustomSession(tag)}
										shortcut={{ modifiers: ["cmd"], key: "enter" }}
									/>
									<Action
										title="View Statistics"
										icon={Icon.BarChart}
										onAction={handleViewStats}
									/>
									<Action
										title="Refresh"
										icon={Icon.ArrowClockwise}
										onAction={loadData}
									/>
								</ActionPanel>
							}
						/>
					))}
				</List.Section>
			)}

			{/* All Available Tags Section */}
			{availableTags.length > 0 && (
				<List.Section title="All Tags">
					{availableTags.slice(0, 10).map((tag) => (
						<List.Item
							key={tag}
							title={`Start ${tag} session`}
							subtitle="Customize duration and settings"
							icon={Icon.Tag}
							actions={
								<ActionPanel>
									<Action
										title={`Start ${tag} Session`}
										icon={Icon.Play}
										onAction={() => handleCustomSession(tag)}
									/>
									<Action
										title="View Statistics"
										icon={Icon.BarChart}
										onAction={handleViewStats}
									/>
									<Action
										title="Refresh"
										icon={Icon.ArrowClockwise}
										onAction={loadData}
									/>
								</ActionPanel>
							}
						/>
					))}
					{availableTags.length > 10 && (
						<List.Item
							title={`View ${availableTags.length - 10} more tags`}
							subtitle="Use the full tag management interface"
							icon={Icon.Ellipsis}
							actions={
								<ActionPanel>
									<Action
										title="Manage Tags"
										icon={Icon.Tag}
										onAction={() =>
											open("raycast://extensions/pedropini/focus/manage-tags")
										}
									/>
									<Action
										title="View Statistics"
										icon={Icon.BarChart}
										onAction={handleViewStats}
									/>
								</ActionPanel>
							}
						/>
					)}
				</List.Section>
			)}

			{availableTags.length === 0 && !isLoading && (
				<List.EmptyView
					title="No Tags Available"
					description="Create your first tag to get started with quick sessions"
					icon={Icon.Tag}
					actions={
						<ActionPanel>
							<Action
								title="Manage Tags"
								icon={Icon.Tag}
								onAction={() =>
									open("raycast://extensions/pedropini/focus/manage-tags")
								}
							/>
							<Action
								title="Start Custom Session"
								icon={Icon.Play}
								onAction={() =>
									open(
										"raycast://extensions/pedropini/focus/start-session-with-tag",
									)
								}
							/>
						</ActionPanel>
					}
				/>
			)}
		</List>
	);
}
