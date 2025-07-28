import {
	Action,
	ActionPanel,
	Alert,
	Color,
	confirmAlert,
	Form,
	Icon,
	List,
	LocalStorage,
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
	const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingTag, setEditingTag] = useState<Tag | null>(null);
	const [searchText, setSearchText] = useState("");

	useEffect(() => {
		loadTagsData();
	}, []);

	useEffect(() => {
		// Filter tags based on search text
		if (!searchText.trim()) {
			setFilteredTags(tags);
		} else {
			const filtered = tags.filter(
				(tag) =>
					tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
					tag.usageCount.toString().includes(searchText),
			);
			setFilteredTags(filtered);
		}
	}, [tags, searchText]);

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
				message: "Please try refreshing the data",
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
				message: `Tag "${tagName}" has been created and is now available for sessions`,
			});
		} catch (error) {
			console.error("Error creating tag:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to Create Tag",
				message: "Please try again",
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
				message: "Please try again",
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
					message: "Please try again",
				});
			}
		}
	};

	const handleBulkDelete = async () => {
		const unusedTags = filteredTags.filter((tag) => tag.usageCount === 0);

		if (unusedTags.length === 0) {
			await showToast({
				style: Toast.Style.Success,
				title: "No Unused Tags",
				message: "All tags are currently in use",
			});
			return;
		}

		const confirmed = await confirmAlert({
			title: "Delete Unused Tags",
			message: `Are you sure you want to delete ${unusedTags.length} unused tags? This action cannot be undone.`,
			primaryAction: {
				title: "Delete All",
				style: Alert.ActionStyle.Destructive,
			},
		});

		if (confirmed) {
			try {
				for (const tag of unusedTags) {
					await removeTag(tag.name);
				}
				await loadTagsData();
				await showToast({
					style: Toast.Style.Success,
					title: "Tags Deleted",
					message: `${unusedTags.length} unused tags have been deleted`,
				});
			} catch (error) {
				console.error("Error deleting tags:", error);
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to Delete Tags",
					message: "Please try again",
				});
			}
		}
	};

	const handleExportTags = async () => {
		try {
			const exportData = {
				exportDate: new Date().toISOString(),
				totalTags: tags.length,
				tags: tags.map((tag) => ({
					name: tag.name,
					usageCount: tag.usageCount,
					createdAt: tag.createdAt,
				})),
			};

			await showToast({
				style: Toast.Style.Success,
				title: "Tags Ready for Export",
				message: `${tags.length} tags exported successfully`,
			});
		} catch (error) {
			console.error("Error exporting tags:", error);
			await showToast({
				style: Toast.Style.Failure,
				title: "Export Failed",
				message: "Please try again",
			});
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

	const unusedTagsCount = filteredTags.filter(
		(tag) => tag.usageCount === 0,
	).length;
	const totalUsageCount = filteredTags.reduce(
		(sum, tag) => sum + tag.usageCount,
		0,
	);

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search tags by name or usage count..."
			onSearchTextChange={setSearchText}
			actions={
				<ActionPanel>
					<Action
						title="Create New Tag"
						icon={Icon.Plus}
						onAction={() => setShowCreateForm(true)}
						shortcut={{ modifiers: ["cmd"], key: "n" }}
					/>
					{unusedTagsCount > 0 && (
						<Action
							title="Delete Unused Tags"
							icon={Icon.Trash}
							style={Action.Style.Destructive}
							onAction={handleBulkDelete}
							shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
						/>
					)}
					<Action
						title="Export Tags"
						icon={Icon.Download}
						onAction={handleExportTags}
						shortcut={{ modifiers: ["cmd"], key: "e" }}
					/>
					<Action
						title="Refresh"
						icon={Icon.ArrowClockwise}
						onAction={loadTagsData}
						shortcut={{ modifiers: ["cmd"], key: "r" }}
					/>
				</ActionPanel>
			}
		>
			{/* Summary Section */}
			<List.Section title="Overview">
				<List.Item
					title={`${filteredTags.length} Tags`}
					subtitle={`${totalUsageCount} total uses • ${unusedTagsCount} unused`}
					icon={Icon.Tag}
					accessories={[
						{
							text: `${Math.round(((filteredTags.length - unusedTagsCount) / filteredTags.length) * 100)}% used`,
							icon: Icon.BarChart,
						},
					]}
				/>
			</List.Section>

			{/* Tags List */}
			<List.Section title="Tags">
				{filteredTags.map((tag) => (
					<List.Item
						key={tag.id}
						title={tag.name}
						subtitle={`Used in ${tag.usageCount} session${tag.usageCount !== 1 ? "s" : ""}`}
						icon={
							tag.usageCount > 0
								? Icon.Tag
								: { source: Icon.Tag, tintColor: Color.SecondaryText }
						}
						accessories={[
							{
								text: tag.usageCount > 0 ? "Active" : "Unused",
								icon: tag.usageCount > 0 ? Icon.Checkmark : Icon.Xmark,
							},
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
									shortcut={{ modifiers: ["cmd"], key: "e" }}
								/>
								<Action
									title="Delete Tag"
									icon={Icon.Trash}
									style={Action.Style.Destructive}
									onAction={() => handleDeleteTag(tag)}
									shortcut={{ modifiers: ["cmd"], key: "delete" }}
								/>
								<Action
									title="Create New Tag"
									icon={Icon.Plus}
									onAction={() => setShowCreateForm(true)}
								/>
								{unusedTagsCount > 0 && (
									<Action
										title="Delete Unused Tags"
										icon={Icon.Trash}
										style={Action.Style.Destructive}
										onAction={handleBulkDelete}
									/>
								)}
								<Action
									title="Refresh"
									icon={Icon.ArrowClockwise}
									onAction={loadTagsData}
								/>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>

			{filteredTags.length === 0 && !isLoading && (
				<List.EmptyView
					title={searchText ? "No Tags Found" : "No Tags Found"}
					description={
						searchText
							? `No tags match "${searchText}"`
							: "Create your first tag to get started"
					}
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
