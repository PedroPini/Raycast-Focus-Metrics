# Focus - Website Blocker
The Focus extension allows you to manage Focus app directly in Raycast.

<<<<<<< HEAD
A Raycast extension that wraps Focus deeplinks and adds session tracking with tags for better productivity insights. **Now with reduced friction and enhanced user experience!**

## ✨ New Features & Improvements

### 🚀 Quick Session Actions
- **One-click session start** with pre-configured templates
- **Smart defaults** that remember your preferences
- **Recent tags** for faster access to commonly used tags
- **Bulk operations** for managing multiple sessions

### 🎯 Enhanced User Experience
- **Productivity scoring** to track your focus effectiveness
- **Real-time updates** in the menu bar with session status
- **Keyboard shortcuts** for faster navigation
- **Better visual feedback** with color-coded status indicators
- **Improved error handling** with user-friendly messages

### 📊 Advanced Statistics
- **Overview dashboard** with total sessions and time
- **Productivity metrics** with completion rates
- **Export functionality** for data analysis
- **Search and filtering** capabilities

## Features

- **Session Tracking**: Automatically track Focus sessions with custom tags
- **Quick Actions**: Start sessions instantly with pre-configured templates
- **Smart Defaults**: Remember user preferences for faster setup
- **Statistics View**: View session statistics grouped by tags with productivity scoring
- **Session Management**: Mark sessions as completed or remove them with bulk operations
- **Real-time Status**: Menu bar integration with live session updates
- **Deeplink Support**: Call the extension programmatically via deeplinks

## Commands

### Quick Session Actions ⭐ NEW

Start focus sessions instantly with pre-configured templates for common use cases.

**Features:**
- One-click session start for coding, writing, reading, meetings, and planning
- Recent tags for quick access
- Custom session creation with existing tags
- Deep work mode with comprehensive blocking

**Quick Actions Available:**
- **Quick Coding** (30min) - Block social, messaging, streaming, gaming
- **Quick Writing** (30min) - Block social, messaging, streaming
- **Quick Reading** (30min) - Block social, messaging, streaming, gaming
- **Meeting Prep** (15min) - Block social, messaging, streaming
- **Quick Planning** (30min) - Block social, messaging, streaming
- **Deep Work** (1hr) - Block all major distractions

### Start Focus Session with Tag

Starts a Focus session and tracks it with a custom tag. Now with smart defaults and templates!

**Arguments:**
- `goal` (optional): Session goal/description
- `categories` (required): Comma-separated list of categories
- `duration` (optional): Duration in seconds
- `mode` (optional): Focus mode (default: "block")
- `tag` (required): Tag for tracking and grouping sessions

**New Features:**
- Quick start templates for common use cases
- Recent tags dropdown for faster selection
- Smart defaults that remember your preferences
- Auto-completion for tag creation

**Example:**
```
raycast://extensions/pedropini/focus/start-session-with-tag?arguments={"goal":"Complete project documentation","categories":"work,documentation","duration":"3600","mode":"block","tag":"project-a"}
```

### View Session Statistics

Displays all tracked sessions grouped by tags with statistics and management options.

**Enhanced Features:**
- **Overview dashboard** with total sessions and time
- **Productivity scoring** based on completion rates and duration
- **Bulk operations** to complete or remove multiple sessions
- **Export functionality** for data analysis
- **Search and filtering** by tag or goal
- **Keyboard shortcuts** for faster navigation

**Productivity Metrics:**
- Completion rate percentage
- Average session duration
- Running vs completed sessions
- Visual indicators for performance

### Manage Tags

Create, edit, and delete tags for focus sessions with enhanced management features.

**New Features:**
- **Search functionality** by name or usage count
- **Bulk delete** for unused tags
- **Usage statistics** with visual indicators
- **Export tags** for backup
- **Overview section** with tag usage metrics

### Focus Status

Show current focus session status in menu bar with real-time updates.

**Enhanced Features:**
- **Real-time updates** every 30 seconds
- **Total elapsed time** display
- **Quick actions** to start new sessions or view stats
- **Session completion** directly from menu bar
- **Visual status indicators** for active sessions

## Usage

### Quick Start (Recommended)
1. **Quick Actions**: Use "Quick Session Actions" for instant session start
2. **Custom Sessions**: Use "Start Focus Session with Tag" for customized sessions
3. **Monitor Progress**: Check "Focus Status" in menu bar for real-time updates
4. **View Analytics**: Use "View Session Statistics" to track your productivity

### Advanced Usage
1. **Create Tags**: Use "Manage Tags" to organize your sessions
2. **Custom Templates**: Modify quick actions in the code for your specific needs
3. **Data Export**: Export your session data for external analysis
4. **Deeplinks**: Integrate with other tools using deeplink format

## Keyboard Shortcuts

### Quick Session Actions
- `Cmd + Enter`: Start selected quick action
- `Cmd + R`: Refresh data
- `Cmd + S`: View statistics

### Session Statistics
- `Cmd + R`: Refresh data
- `Cmd + V`: Toggle view mode (summary/detailed)
- `Cmd + E`: Export data
- `Cmd + C`: Complete all running sessions (when available)
- `Cmd + Enter`: Mark session as completed
- `Cmd + Delete`: Remove session

### Manage Tags
- `Cmd + N`: Create new tag
- `Cmd + E`: Edit selected tag
- `Cmd + Delete`: Delete selected tag
- `Cmd + Shift + Delete`: Delete unused tags
- `Cmd + E`: Export tags
- `Cmd + R`: Refresh data

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

**User Preferences:**
- Recent tags (last 5 used)
- Default duration
- Default categories
- Session templates

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

## Friction Reduction Features

### 🎯 What We've Improved

1. **Quick Start Templates**: Pre-configured sessions for common use cases
2. **Smart Defaults**: Remember user preferences for faster setup
3. **Recent Tags**: Quick access to commonly used tags
4. **Bulk Operations**: Manage multiple sessions at once
5. **Real-time Updates**: Live status updates in menu bar
6. **Keyboard Shortcuts**: Faster navigation and actions
7. **Better Visual Feedback**: Color-coded status indicators
8. **Improved Error Handling**: User-friendly error messages
9. **Search & Filtering**: Find sessions and tags quickly
10. **Export Functionality**: Backup and analyze your data

### 🚀 Performance Improvements

- **Lazy Loading**: Only load data when needed
- **Caching**: Store user preferences locally
- **Optimized Updates**: Efficient real-time status updates
- **Reduced API Calls**: Smart data refresh strategies

## License

MIT
=======
## Requirements
You need to have the Focus app for Mac installed to use this extension. You can download it from [https://heyfocus.com](https://heyfocus.com).

>>>>>>> contributions/merge-1754878586437
