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
import { useState } from "react";
import { addSession } from "./sessionStorage";
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
	const [categories, setCategories] = useState("social,messaging,streaming");
	const [tag, setTag] = useState("");

	const handleSubmit = async (values: {
		goal: string;
		duration: string;
		mode: string;
		categories: string;
		tag: string;
	}) => {
		try {
			// Create session record
			const session = createSession({
				goal: values.goal,
				duration: values.duration,
				mode: values.mode,
				categories: values.categories,
				tag: values.tag,
			});

			// Store session in local storage
			await addSession(session);

			// Build and trigger Focus deeplink
			const deeplink = buildFocusDeeplink({
				goal: values.goal,
				duration: values.duration,
				mode: values.mode,
				categories: values.categories,
				tag: values.tag,
			});
			await open(deeplink);

			// Show success toast
			await showToast({
				style: Toast.Style.Success,
				title: "Session Started",
				message: `Tag: ${values.tag} | Duration: ${values.duration ? formatDuration(parseInt(values.duration, 10)) : "No limit"}`,
			});
		} catch (error) {
			console.error("Error starting session:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Start Session",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	};

	return (
		<Form
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
			/>

			<Form.Dropdown
				id="duration"
				title="Duration"
				value={duration}
				onChange={setDuration}
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

			<Form.TextField
				id="categories"
				title="Categories to Block"
				placeholder="social,messaging,streaming"
				value={categories}
				onChange={setCategories}
				info="Comma-separated list of categories to block during the session"
			/>

			<Form.TextField
				id="tag"
				title="Tag"
				placeholder="Enter a tag for tracking this session"
				value={tag}
				onChange={setTag}
				info="This tag will be used to group and track your sessions"
			/>
		</Form>
	);
}
