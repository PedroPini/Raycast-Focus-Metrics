import {
	Action,
	ActionPanel,
	Color,
	Form,
	Icon,
	open,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { addSession, getAllTags } from "./sessionStorage";
import type { Session, SessionArguments } from "./types";

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

	// Load existing tags on component mount
	useEffect(() => {
		const loadTags = async () => {
			try {
				const tags = await getAllTags();
				setAvailableTags(tags);
			} catch (error) {
				console.error("Error loading tags:", error);
			} finally {
				setIsLoadingTags(false);
			}
		};
		loadTags();
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

			<Form.Dropdown
				id="tag"
				title="Tag"
				value={tag}
				onChange={setTag}
				placeholder="Enter a tag for tracking this session"
				info="Select an existing tag or type to create a new one"
			>
				{availableTags.map((tagOption) => (
					<Form.Dropdown.Item
						key={tagOption}
						value={tagOption}
						title={tagOption}
					/>
				))}
				{tag && !availableTags.includes(tag) && (
					<Form.Dropdown.Item
						value={tag}
						title={`Create "${tag}"`}
						icon={Icon.Plus}
					/>
				)}
			</Form.Dropdown>
		</Form>
	);
}
