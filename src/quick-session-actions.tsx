import { Action, ActionPanel, Color, Form, Icon, List, LocalStorage, open, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { addSession, getAllTags } from "./sessionStorage";
import type { CustomAction, DeeplinkArgs, Session } from "./types";

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

// Available icons for custom actions
const AVAILABLE_ICONS = [
  { id: "code", icon: Icon.Code, title: "Code" },
  { id: "document", icon: Icon.Document, title: "Document" },
  { id: "book", icon: Icon.Book, title: "Book" },
  { id: "person", icon: Icon.Person, title: "Person" },
  { id: "calendar", icon: Icon.Calendar, title: "Calendar" },
  { id: "bullseye", icon: Icon.BullsEye, title: "Target" },
  { id: "play", icon: Icon.Play, title: "Play" },
  { id: "heart", icon: Icon.Heart, title: "Heart" },
  { id: "star", icon: Icon.Star, title: "Star" },
  { id: "lightbulb", icon: Icon.LightBulb, title: "Lightbulb" },
  { id: "gear", icon: Icon.Gear, title: "Gear" },
  { id: "tag", icon: Icon.Tag, title: "Tag" },
];

// Available colors for custom actions
const AVAILABLE_COLORS = [
  { id: "blue", color: Color.Blue, title: "Blue" },
  { id: "green", color: Color.Green, title: "Green" },
  { id: "orange", color: Color.Orange, title: "Orange" },
  { id: "purple", color: Color.Purple, title: "Purple" },
  { id: "yellow", color: Color.Yellow, title: "Yellow" },
  { id: "red", color: Color.Red, title: "Red" },
  { id: "magenta", color: Color.Magenta, title: "Magenta" },
  { id: "brown", color: Color.Brown, title: "Brown" },
];

// Focus categories for selection
const FOCUS_CATEGORIES = [
  { id: "social", title: "Social" },
  { id: "messaging", title: "Messaging" },
  { id: "streaming", title: "Streaming" },
  { id: "gaming", title: "Gaming" },
  { id: "news", title: "News" },
  { id: "shopping", title: "Shopping" },
  { id: "entertainment", title: "Entertainment" },
  { id: "work", title: "Work" },
  { id: "productivity", title: "Productivity" },
  { id: "education", title: "Education" },
  { id: "health", title: "Health" },
  { id: "finance", title: "Finance" },
];

/**
 * Load custom actions from storage
 */
const loadCustomActions = async (): Promise<CustomAction[]> => {
  try {
    const customActions = await LocalStorage.getItem<string>("custom-quick-actions");
    return customActions ? JSON.parse(customActions) : [];
  } catch (error) {
    console.error("Error loading custom actions:", error);
    return [];
  }
};

/**
 * Save custom actions to storage
 */
const saveCustomActions = async (actions: CustomAction[]) => {
  try {
    await LocalStorage.setItem("custom-quick-actions", JSON.stringify(actions));
  } catch (error) {
    console.error("Error saving custom actions:", error);
  }
};

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
const buildFocusDeeplink = (args: DeeplinkArgs): string => {
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
const createSession = (args: DeeplinkArgs): Session => {
  return {
    id: Date.now().toString(),
    tag: args.tag || "",
    goal: args.goal,
    categories: args.categories || "",
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
  const [customActions, setCustomActions] = useState<CustomAction[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tags, customActionsData] = await Promise.all([getAllTags(), loadCustomActions()]);
      setAvailableTags(tags);
      setCustomActions(customActionsData);

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
      await open(`raycast://extensions/pedropini/focus/start-session-with-tag?arguments={"tag":"${tag}"}`);
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

  const handleCreateCustomAction = async (values: {
    title: string;
    goal: string;
    duration: string;
    tag: string;
    icon: string;
    color: string;
    categories: string[];
  }) => {
    try {
      const newAction = {
        id: `custom-${Date.now()}`,
        title: values.title,
        goal: values.goal,
        duration: values.duration,
        categories: values.categories.join(","),
        tag: values.tag,
        icon: AVAILABLE_ICONS.find((i) => i.id === values.icon)?.icon || Icon.Tag,
        color: AVAILABLE_COLORS.find((c) => c.id === values.color)?.color || Color.Blue,
        isCustom: true,
      };

      const updatedActions = [...customActions, newAction];
      await saveCustomActions(updatedActions);
      setCustomActions(updatedActions);
      setShowCreateForm(false);

      await showToast({
        style: Toast.Style.Success,
        title: "Custom Action Created",
        message: `${values.title} has been added to your quick actions`,
      });
    } catch (error) {
      console.error("Error creating custom action:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Action",
        message: "Please try again",
      });
    }
  };

  const handleDeleteCustomAction = async (actionId: string) => {
    try {
      const updatedActions = customActions.filter((action) => action.id !== actionId);
      await saveCustomActions(updatedActions);
      setCustomActions(updatedActions);

      await showToast({
        style: Toast.Style.Success,
        title: "Action Deleted",
        message: "Custom action has been removed",
      });
    } catch (error) {
      console.error("Error deleting custom action:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Delete Action",
        message: "Please try again",
      });
    }
  };

  // Show create form
  if (showCreateForm) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Create Custom Action" icon={Icon.Plus} onSubmit={handleCreateCustomAction} />
            <Action title="Cancel" icon={Icon.XMarkCircle} onAction={() => setShowCreateForm(false)} />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="title"
          title="Action Title"
          placeholder="e.g., Quick Study, Deep Work, Meeting Prep"
          info="Give your custom action a descriptive name"
        />

        <Form.TextField
          id="goal"
          title="Goal"
          placeholder="What do you want to focus on?"
          info="Set a clear goal for this focus session"
        />

        <Form.Dropdown id="duration" title="Duration" info="Choose how long this session should last">
          <Form.Dropdown.Item value="900" title="15 minutes" />
          <Form.Dropdown.Item value="1800" title="30 minutes" />
          <Form.Dropdown.Item value="2700" title="45 minutes" />
          <Form.Dropdown.Item value="3600" title="1 hour" />
          <Form.Dropdown.Item value="5400" title="1.5 hours" />
          <Form.Dropdown.Item value="7200" title="2 hours" />
        </Form.Dropdown>

        <Form.TextField
          id="tag"
          title="Tag"
          placeholder="Enter a tag for tracking"
          info="This tag will be used to track and group sessions"
        />

        <Form.Dropdown id="icon" title="Icon" info="Choose an icon for your custom action">
          {AVAILABLE_ICONS.map((iconOption) => (
            <Form.Dropdown.Item
              key={iconOption.id}
              value={iconOption.id}
              title={iconOption.title}
              icon={{ source: iconOption.icon, tintColor: Color.Blue }}
            />
          ))}
        </Form.Dropdown>

        <Form.Dropdown id="color" title="Color" info="Choose a color for your custom action">
          {AVAILABLE_COLORS.map((colorOption) => (
            <Form.Dropdown.Item
              key={colorOption.id}
              value={colorOption.id}
              title={colorOption.title}
              icon={{ source: Icon.Circle, tintColor: colorOption.color }}
            />
          ))}
        </Form.Dropdown>

        <Form.Separator />

        <Form.Description text="Select categories to block during this session:" />
        {FOCUS_CATEGORIES.map((category) => (
          <Form.Checkbox
            key={category.id}
            id={`category-${category.id}`}
            title={category.title}
            label={category.title}
            defaultValue={["social", "messaging", "streaming"].includes(category.id)}
          />
        ))}
      </Form>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search quick actions..."
      actions={
        <ActionPanel>
          <Action
            title="Create Custom Action"
            icon={Icon.Plus}
            onAction={() => setShowCreateForm(true)}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
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
      <List.Section title="Built-in Actions">
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
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                />
                <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
                <Action title="View Statistics" icon={Icon.BarChart} onAction={handleViewStats} />
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadData} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {/* Custom Actions Section */}
      {customActions.length > 0 && (
        <List.Section title="Custom Actions">
          {customActions.map((action) => (
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
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                  />
                  <Action
                    title="Delete Custom Action"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => handleDeleteCustomAction(action.id)}
                  />
                  <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
                  <Action title="View Statistics" icon={Icon.BarChart} onAction={handleViewStats} />
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadData} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

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
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                  />
                  <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
                  <Action title="View Statistics" icon={Icon.BarChart} onAction={handleViewStats} />
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadData} />
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
                  <Action title={`Start ${tag} Session`} icon={Icon.Play} onAction={() => handleCustomSession(tag)} />
                  <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
                  <Action title="View Statistics" icon={Icon.BarChart} onAction={handleViewStats} />
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadData} />
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
                    onAction={() => open("raycast://extensions/pedropini/focus/manage-tags")}
                  />
                  <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
                  <Action title="View Statistics" icon={Icon.BarChart} onAction={handleViewStats} />
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
              <Action title="Create Custom Action" icon={Icon.Plus} onAction={() => setShowCreateForm(true)} />
              <Action
                title="Manage Tags"
                icon={Icon.Tag}
                onAction={() => open("raycast://extensions/pedropini/focus/manage-tags")}
              />
              <Action
                title="Start Custom Session"
                icon={Icon.Play}
                onAction={() => open("raycast://extensions/pedropini/focus/start-session-with-tag")}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
