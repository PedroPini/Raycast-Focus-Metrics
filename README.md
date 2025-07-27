# Focus Session Tracker

A Raycast extension that wraps Focus deeplinks and adds session tracking with tags for better productivity insights.

## Features

- **Session Tracking**: Automatically track Focus sessions with custom tags
- **Statistics View**: View session statistics grouped by tags
- **Session Management**: Mark sessions as completed or remove them
- **Deeplink Support**: Call the extension programmatically via deeplinks

## Commands

### Start Focus Session with Tag

Starts a Focus session and tracks it with a custom tag.

**Arguments:**
- `goal` (optional): Session goal/description
- `categories` (required): Comma-separated list of categories
- `duration` (optional): Duration in seconds
- `mode` (optional): Focus mode (default: "block")
- `tag` (required): Tag for tracking and grouping sessions

**Example:**
```
raycast://extensions/pedropini/focus/start-session-with-tag?arguments={"goal":"Complete project documentation","categories":"work,documentation","duration":"3600","mode":"block","tag":"project-a"}
```

### View Session Statistics

Displays all tracked sessions grouped by tags with statistics and management options.

**Features:**
- View total duration and session count per tag
- Mark running sessions as completed
- Remove individual sessions or all sessions for a tag
- See session details including goal, categories, and timestamps

## Usage

1. **Start a Session**: Use the "Start Focus Session with Tag" command and fill in the required parameters
2. **View Statistics**: Use the "View Session Statistics" command to see your tracked sessions
3. **Manage Sessions**: Use the action panel to mark sessions as completed or remove them

## Deeplink Format

You can call the extension programmatically using this deeplink format:

```
raycast://extensions/pedropini/focus/start-session-with-tag?arguments={"goal":"Your goal","categories":"category1,category2","duration":"3600","mode":"block","tag":"your-tag"}
```

**Parameters:**
- `goal`: Session goal (optional)
- `categories`: Comma-separated categories (required)
- `duration`: Duration in seconds (optional)
- `mode`: Focus mode (optional, default: "block")
- `tag`: Tracking tag (required)

## Development

### Prerequisites

- Raycast
- Node.js
- npm

### Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

### Building

```bash
npm run build
```

### Publishing

```bash
npm run publish
```

## Data Storage

Sessions are stored locally using Raycast's LocalStorage API. Each session record includes:

- Unique ID
- Tag
- Goal (optional)
- Categories
- Duration (optional)
- Mode
- Status (running/completed)
- Start timestamp
- End timestamp (when completed)

## License

MIT