import {
	Action,
	ActionPanel,
	Color,
	Form,
	Icon,
	LocalStorage,
	open,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { addSession, getAllTags } from "./sessionStorage";
import type { Session, SessionArguments } from "./types";

// Quick start templates for common use cases
const QUICK_TEMPLATES = [
	{
		id: "coding",
		title: "Coding Session",
		goal: "Write clean, efficient code",
		duration: "3600",
		categories: ["social", "messaging", "streaming", "gaming"],
		tag: "coding",
		icon: Icon.Code,
	},
	{
		id: "writing",
		title: "Writing Session",
		goal: "Focus on writing without distractions",
		duration: "2700",
		categories: ["social", "messaging", "streaming"],
		tag: "writing",
		icon: Icon.Document,
	},
	{
		id: "reading",
		title: "Reading Session",
		goal: "Deep reading and comprehension",
		duration: "1800",
		categories: ["social", "messaging", "streaming", "gaming"],
		tag: "reading",
		icon: Icon.Book,
	},
	{
		id: "meeting",
		title: "Meeting Prep",
		goal: "Prepare for upcoming meeting",
		duration: "900",
		categories: ["social", "messaging", "streaming"],
		tag: "meeting",
		icon: Icon.Person,
	},
	{
		id: "planning",
		title: "Planning Session",
		goal: "Plan and organize tasks",
		duration: "1800",
		categories: ["social", "messaging", "streaming"],
		tag: "planning",
		icon: Icon.Calendar,
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
const buildFocusDeeplink = (args: SessionArguments): string => {
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
const createSession = (args: SessionArguments): Session => {
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

/**
 * Load user preferences from storage
 */
const loadUserPreferences = async () => {
	try {
		const preferences = await LocalStorage.getItem<string>("user-preferences");
		return preferences ? JSON.parse(preferences) : {};
	} catch (error) {
		console.error("Error loading preferences:", error);
		return {};
	}
};

/**
 * Save user preferences to storage
 */
const saveUserPreferences = async (preferences: any) => {
	try {
		await LocalStorage.setItem("user-preferences", JSON.stringify(preferences));
	} catch (error) {
		console.error("Error saving preferences:", error);
	}
};

export default function Command() {
	const [goal, setGoal] = useState("");
	const [duration, setDuration] = useState("1800"); // 30 minutes default
	const [mode, setMode] = useState("block");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		"social",
		"messaging",
		"streaming",
	]);
	const [tag, setTag] = useState("");
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [isLoadingTags, setIsLoadingTags] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showTemplates, setShowTemplates] = useState(false);
	const [recentTags, setRecentTags] = useState<string[]>([]);
	const [activeSession, setActiveSession] = useState<Session | null>(null);

	// Load existing tags and user preferences on component mount
	useEffect(() => {
		const loadData = async () => {
			try {
				const [tags, preferences] = await Promise.all([
					getAllTags(),
					loadUserPreferences(),
				]);
				setAvailableTags(tags);
				setRecentTags(preferences.recentTags || []);

				// Apply user preferences
				if (preferences.defaultDuration) {
					setDuration(preferences.defaultDuration);
				}
				if (preferences.defaultCategories) {
					setSelectedCategories(preferences.defaultCategories);
				}
			} catch (error) {
				console.error("Error loading data:", error);
			} finally {
				setIsLoadingTags(false);
			}
		};
		loadData();
	}, []);

	// Standard Focus categories that match Raycast's official Focus app
	const focusCategories = [
		{ id: "social", title: "Social", icon: Icon.Person },
		{ id: "messaging", title: "Messaging", icon: Icon.Message },
		{ id: "streaming", title: "Streaming", icon: Icon.Video },
		{ id: "gaming", title: "Gaming", icon: Icon.GameController },
		{ id: "news", title: "News", icon: Icon.Document },
		{ id: "shopping", title: "Shopping", icon: Icon.Cart },
		{ id: "entertainment", title: "Entertainment", icon: Icon.Video },
		{ id: "work", title: "Work", icon: Icon.Document },
		{ id: "productivity", title: "Productivity", icon: Icon.Checkmark },
		{ id: "education", title: "Education", icon: Icon.Book },
		{ id: "health", title: "Health", icon: Icon.Heart },
		{ id: "finance", title: "Finance", icon: Icon.CreditCard },
	];

	const handleCategoryToggle = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId],
		);
	};

	const handleTemplateSelect = (template: (typeof QUICK_TEMPLATES)[0]) => {
		setGoal(template.goal);
		setDuration(template.duration);
		setSelectedCategories(template.categories);
		setTag(template.tag);
		setShowTemplates(false);
	};

	const updateRecentTags = async (newTag: string) => {
		const updated = [newTag, ...recentTags.filter((t) => t !== newTag)].slice(
			0,
			5,
		);
		setRecentTags(updated);

		const preferences = await loadUserPreferences();
		preferences.recentTags = updated;
		await saveUserPreferences(preferences);
	};

	const handleSubmit = async (values: {
		goal: string;
		duration: string;
		mode: string;
		tag: string;
	}) => {
		try {
			setIsSubmitting(true);
			const categoriesString = selectedCategories.join(",");
			const finalTag = values.tag;

			if (!finalTag.trim()) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Tag Required",
					message: "Please enter a tag for tracking this session",
				});
				return;
			}

			if (selectedCategories.length === 0) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Categories Required",
					message: "Please select at least one category to block",
				});
				return;
			}

			// Create session record
			const session = createSession({
				goal: values.goal,
				duration: values.duration,
				mode: values.mode,
				categories: categoriesString,
				tag: finalTag,
			});

			// Store session in local storage
			await addSession(session);

			// Update recent tags and preferences
			await updateRecentTags(finalTag);

			// Save user preferences for next time
			const preferences = await loadUserPreferences();
			preferences.defaultDuration = values.duration;
			preferences.defaultCategories = selectedCategories;
			await saveUserPreferences(preferences);

			// Reload available tags to include the new one
			const updatedTags = await getAllTags();
			setAvailableTags(updatedTags);

			// Build and trigger Focus deeplink
			const deeplink = buildFocusDeeplink({
				goal: values.goal,
				duration: values.duration,
				mode: values.mode,
				categories: categoriesString,
				tag: finalTag,
			});
			await open(deeplink);

			// Set active session for better UX
			setActiveSession(session);

			// Show success toast with enhanced message
			const durationText = values.duration
				? formatDuration(parseInt(values.duration, 10))
				: "No limit";
			await showToast({
				style: Toast.Style.Success,
				title: "Focus Session Started",
				message: `"${finalTag}" - ${durationText} • ${selectedCategories.length} categories blocked`,
			});
		} catch (error) {
			console.error("Error starting session:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Start Session",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleStartNewSession = () => {
		setActiveSession(null);
		setGoal("");
		setDuration("1800");
		setSelectedCategories(["social", "messaging", "streaming"]);
		setTag("");
	};

	const handleViewStats = async () => {
		try {
			await open("raycast://extensions/pedropini/focus/view-session-stats");
		} catch (error) {
			console.error("Error opening stats:", error);
		}
	};

	const handleCompleteSession = async () => {
		if (!activeSession) return;

		try {
			// Import the function dynamically to avoid circular dependencies
			const { markSessionCompleted } = await import("./sessionStorage");
			await markSessionCompleted(activeSession.id);

			setActiveSession(null);
			await showToast({
				style: Toast.Style.Success,
				title: "Session Completed",
				message: "Focus session has been marked as completed",
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

	if (showTemplates) {
		return (
			<Form
				actions={
					<ActionPanel>
						<Action
							title="Back to Form"
							icon={Icon.ArrowLeft}
							onAction={() => setShowTemplates(false)}
						/>
					</ActionPanel>
				}
			>
				<Form.Description text="Choose a quick start template or go back to customize your session" />
				{QUICK_TEMPLATES.map((template) => (
					<Form.Description
						key={template.id}
						text={`${template.title}: ${template.goal} (${formatDuration(parseInt(template.duration))})`}
					/>
				))}
			</Form>
		);
	}

	// Show session active state
	if (activeSession) {
		const elapsedTime = Math.floor(
			(Date.now() - activeSession.startTime) / 1000,
		);
		const remainingTime = activeSession.duration
			? activeSession.duration - elapsedTime
			: null;

		return (
			<Form
				actions={
					<ActionPanel>
						<Action
							title="Complete Session"
							icon={Icon.Checkmark}
							onAction={handleCompleteSession}
							shortcut={{ modifiers: ["cmd"], key: "enter" }}
						/>
						<Action
							title="Start New Session"
							icon={Icon.Play}
							onAction={handleStartNewSession}
							shortcut={{ modifiers: ["cmd"], key: "n" }}
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
				<Form.Description
					text={`🎯 **${activeSession.goal || "No goal set"}**`}
				/>
				<Form.Description
					text={`📊 **Session Active** • Tag: ${activeSession.tag}`}
				/>
				<Form.Description
					text={`⏱️ **Elapsed**: ${formatDuration(elapsedTime)}`}
				/>
				{remainingTime !== null && (
					<Form.Description
						text={`⏳ **Remaining**: ${formatDuration(Math.max(0, remainingTime))}`}
					/>
				)}
				<Form.Description
					text={`🔒 **Blocking**: ${activeSession.categories.split(",").length} categories`}
				/>
				<Form.Description
					text={`📅 **Started**: ${new Date(activeSession.startTime).toLocaleTimeString()}`}
				/>

				<Form.Separator />

				<Form.Description text="Your focus session is now active! Focus is blocking the selected categories." />
				<Form.Description text="You can complete this session early or start a new one when ready." />
			</Form>
		);
	}

	return (
		<Form
			isLoading={isSubmitting}
			actions={
				<ActionPanel>
					<Action.SubmitForm
						title="Start Focus Session"
						icon={Icon.Play}
						onSubmit={handleSubmit}
					/>
					<Action
						title="Quick Start Templates"
						icon={Icon.Bolt}
						onAction={() => setShowTemplates(true)}
					/>
					<Action
						title="Clear Form"
						icon={Icon.Trash}
						style={Action.Style.Destructive}
						onAction={() => {
							setGoal("");
							setDuration("1800");
							setSelectedCategories(["social", "messaging", "streaming"]);
							setTag("");
						}}
					/>
				</ActionPanel>
			}
		>
			<Form.TextField
				id="goal"
				title="Goal"
				placeholder="What do you want to focus on?"
				value={goal}
				onChange={setGoal}
				info="Set a clear goal for your focus session to stay motivated"
			/>

			<Form.Dropdown
				id="duration"
				title="Duration"
				value={duration}
				onChange={setDuration}
				info="Choose how long you want to focus"
			>
				<Form.Dropdown.Item value="900" title="15 minutes" />
				<Form.Dropdown.Item value="1800" title="30 minutes" />
				<Form.Dropdown.Item value="2700" title="45 minutes" />
				<Form.Dropdown.Item value="3600" title="1 hour" />
				<Form.Dropdown.Item value="5400" title="1.5 hours" />
				<Form.Dropdown.Item value="7200" title="2 hours" />
				<Form.Dropdown.Item value="10800" title="3 hours" />
				<Form.Dropdown.Item value="14400" title="4 hours" />
			</Form.Dropdown>

			<Form.Dropdown id="mode" title="Mode" value={mode} onChange={setMode}>
				<Form.Dropdown.Item
					value="block"
					title="Block"
					icon={{ source: Icon.Lock, tintColor: Color.Red }}
				/>
				<Form.Dropdown.Item
					value="allow"
					title="Allow"
					icon={{ source: Icon.Checkmark, tintColor: Color.Green }}
				/>
			</Form.Dropdown>

			<Form.Dropdown
				id="tag"
				title="Tag"
				value={tag}
				onChange={setTag}
				placeholder="Enter a tag for tracking this session"
				info="Select an existing tag or type to create a new one"
			>
				{recentTags.length > 0 && (
					<Form.Dropdown.Section title="Recent Tags">
						{recentTags.map((tagOption) => (
							<Form.Dropdown.Item
								key={tagOption}
								value={tagOption}
								title={tagOption}
								icon={Icon.Clock}
							/>
						))}
					</Form.Dropdown.Section>
				)}
				{availableTags.length > 0 && (
					<Form.Dropdown.Section title="Available Tags">
						{availableTags
							.filter((tagOption) => !recentTags.includes(tagOption))
							.map((tagOption) => (
								<Form.Dropdown.Item
									key={tagOption}
									value={tagOption}
									title={tagOption}
								/>
							))}
					</Form.Dropdown.Section>
				)}
				{tag?.trim() &&
					!availableTags.includes(tag) &&
					!recentTags.includes(tag) && (
						<Form.Dropdown.Section title="Create New Tag">
							<Form.Dropdown.Item
								value={tag}
								title={`Create "${tag}"`}
								icon={Icon.Plus}
							/>
						</Form.Dropdown.Section>
					)}
			</Form.Dropdown>

			<Form.Description text="Select categories to block during your focus session:" />
			{focusCategories.map((category) => (
				<Form.Checkbox
					key={category.id}
					id={`category-${category.id}`}
					title={category.title}
					label={category.title}
					value={selectedCategories.includes(category.id)}
					onChange={(checked) => {
						if (checked) {
							setSelectedCategories((prev) => [...prev, category.id]);
						} else {
							setSelectedCategories((prev) =>
								prev.filter((id) => id !== category.id),
							);
						}
					}}
				/>
			))}
		</Form>
	);
}
