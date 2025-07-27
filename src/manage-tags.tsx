import {
	Action,
	ActionPanel,
	Alert,
	Color,
	confirmAlert,
	Form,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
	addTag,
	getAllTags,
	loadTags,
	removeTag,
	saveTags,
} from "./sessionStorage";

interface Tag {
	id: string;
	name: string;
	createdAt: number;
	usageCount: number;
}

export default function Command() {
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingTag, setEditingTag] = useState<Tag | null>(null);

	useEffect(() => {
		loadTagsData();
	}, []);

	const loadTagsData = async () => {
		try {
			setIsLoading(true);
			const tagNames = await getAllTags();
			const tagsWithStats = await Promise.all(
				tagNames.map(async (name) => {
					const usageCount = await getTagUsageCount(name);
					return {
						id: name,
						name,
						createdAt: Date.now(), // We don't store creation time, so using current time
						usageCount,
					};
				}),
			);
			setTags(tagsWithStats);
		} catch (error) {
			console.error("Error loading tags:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Load Tags",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const getTagUsageCount = async (tagName: string): Promise<number> => {
		try {
			const { loadSessions } = await import("./sessionStorage");
			const sessions = await loadSessions();
			return sessions.filter((session) => session.tag === tagName).length;
		} catch (error) {
			console.error("Error getting tag usage count:", error);
			return 0;
		}
	};

	const handleCreateTag = async (values: { name: string }) => {
		try {
			if (!values.name.trim()) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Tag Name Required",
					message: "Please enter a tag name",
				});
				return;
			}

			const tagName = values.name.trim();

			// Check if tag already exists
			if (
				tags.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase())
			) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Tag Already Exists",
					message: `A tag with the name "${tagName}" already exists`,
				});
				return;
			}

			await addTag(tagName);
			await loadTagsData(); // Reload tags
			setShowCreateForm(false);

			await showToast({
				style: Toast.Style.Success,
				title: "Tag Created",
				message: `Tag "${tagName}" has been created`,
			});
		} catch (error) {
			console.error("Error creating tag:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Create Tag",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	};

	const handleEditTag = async (values: { name: string }) => {
		if (!editingTag) return;

		try {
			if (!values.name.trim()) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Tag Name Required",
					message: "Please enter a tag name",
				});
				return;
			}

			const newName = values.name.trim();

			// Check if new name already exists (excluding current tag)
			if (
				tags.some(
					(tag) =>
						tag.id !== editingTag.id &&
						tag.name.toLowerCase() === newName.toLowerCase(),
				)
			) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Tag Name Already Exists",
					message: `A tag with the name "${newName}" already exists`,
				});
				return;
			}

			await updateTagName(editingTag.name, newName);
			await loadTagsData(); // Reload tags
			setEditingTag(null);

			await showToast({
				style: Toast.Style.Success,
				title: "Tag Updated",
				message: `Tag "${editingTag.name}" has been renamed to "${newName}"`,
			});
		} catch (error) {
			console.error("Error updating tag:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Update Tag",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	};

	const updateTagName = async (
		oldName: string,
		newName: string,
	): Promise<void> => {
		try {
			// Update stored tags
			const storedTags = await loadTags();
			const updatedStoredTags = storedTags.map((tag: string) =>
				tag === oldName ? newName : tag,
			);
			await saveTags(updatedStoredTags);

			// Update sessions
			const { loadSessions, saveSessions } = await import("./sessionStorage");
			const sessions = await loadSessions();

			// Update all sessions that use this tag
			const updatedSessions = sessions.map((session) =>
				session.tag === oldName ? { ...session, tag: newName } : session,
			);

			await saveSessions(updatedSessions);
		} catch (error) {
			console.error("Error updating tag name:", error);
			throw error;
		}
	};

	const handleDeleteTag = async (tag: Tag) => {
		const confirmed = await confirmAlert({
			title: "Delete Tag",
			message: `Are you sure you want to delete the tag "${tag.name}"? This will remove the tag from all sessions that use it.`,
			primaryAction: {
				title: "Delete",
				style: Alert.ActionStyle.Destructive,
			},
		});

		if (confirmed) {
			try {
				await removeTag(tag.name);
				await loadTagsData(); // Reload tags

				await showToast({
					style: Toast.Style.Success,
					title: "Tag Deleted",
					message: `Tag "${tag.name}" has been deleted`,
				});
			} catch (error) {
				console.error("Error deleting tag:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Delete Tag",
					message:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			}
		}
	};

	if (showCreateForm) {
		return (
			<Form
				actions={
					<ActionPanel>
						<Action.SubmitForm
							title="Create Tag"
							icon={Icon.Plus}
							onSubmit={handleCreateTag}
						/>
						<Action
							title="Cancel"
							icon={Icon.XMarkCircle}
							onAction={() => setShowCreateForm(false)}
						/>
					</ActionPanel>
				}
			>
				<Form.TextField
					id="name"
					title="Tag Name"
					placeholder="Enter tag name"
					info="This tag will be available for use in focus sessions"
				/>
			</Form>
		);
	}

	if (editingTag) {
		return (
			<Form
				actions={
					<ActionPanel>
						<Action.SubmitForm
							title="Update Tag"
							icon={Icon.Checkmark}
							onSubmit={handleEditTag}
						/>
						<Action
							title="Cancel"
							icon={Icon.XMarkCircle}
							onAction={() => setEditingTag(null)}
						/>
					</ActionPanel>
				}
			>
				<Form.TextField
					id="name"
					title="Tag Name"
					placeholder="Enter new tag name"
					defaultValue={editingTag.name}
					info="This will update the tag name in all existing sessions"
				/>
			</Form>
		);
	}

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search tags..."
			actions={
				<ActionPanel>
					<Action
						title="Create New Tag"
						icon={Icon.Plus}
						onAction={() => setShowCreateForm(true)}
					/>
					<Action
						title="Refresh"
						icon={Icon.ArrowClockwise}
						onAction={loadTagsData}
					/>
				</ActionPanel>
			}
		>
			{tags.map((tag) => (
				<List.Item
					key={tag.id}
					title={tag.name}
					subtitle={`Used in ${tag.usageCount} session${tag.usageCount !== 1 ? "s" : ""}`}
					icon={Icon.Tag}
					accessories={[
						{
							text: new Date(tag.createdAt).toLocaleDateString(),
							icon: Icon.Calendar,
						},
					]}
					actions={
						<ActionPanel>
							<Action
								title="Edit Tag"
								icon={Icon.Pencil}
								onAction={() => setEditingTag(tag)}
							/>
							<Action
								title="Delete Tag"
								icon={Icon.Trash}
								style={Action.Style.Destructive}
								onAction={() => handleDeleteTag(tag)}
							/>
							<Action
								title="Create New Tag"
								icon={Icon.Plus}
								onAction={() => setShowCreateForm(true)}
							/>
							<Action
								title="Refresh"
								icon={Icon.ArrowClockwise}
								onAction={loadTagsData}
							/>
						</ActionPanel>
					}
				/>
			))}

			{tags.length === 0 && !isLoading && (
				<List.EmptyView
					title="No Tags Found"
					description="Create your first tag to get started"
					icon={Icon.Tag}
					actions={
						<ActionPanel>
							<Action
								title="Create New Tag"
								icon={Icon.Plus}
								onAction={() => setShowCreateForm(true)}
							/>
						</ActionPanel>
					}
				/>
			)}
		</List>
	);
}
