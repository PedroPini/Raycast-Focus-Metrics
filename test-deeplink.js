#!/usr/bin/env node

/**
 * Test script to demonstrate the Focus Session Tracker deeplink functionality
 * Run this script to test starting a session with a tag
 */

const { exec } = require("child_process");

// Example session parameters
const sessionParams = {
	goal: "Complete project documentation",
	categories: "work,documentation",
	duration: "3600", // 1 hour in seconds
	mode: "block",
	tag: "project-a",
};

// Build the deeplink URL
const deeplink = `raycast://extensions/pedropini/focus/start-session-with-tag?arguments=${encodeURIComponent(JSON.stringify(sessionParams))}`;

console.log("Testing Focus Session Tracker deeplink...");
console.log("Deeplink URL:", deeplink);
console.log("");

// Execute the deeplink
exec(`open "${deeplink}"`, (error, stdout, stderr) => {
	if (error) {
		console.error("Error executing deeplink:", error);
		return;
	}
	console.log("Deeplink executed successfully!");
	console.log("Check Raycast to see the session being started.");
});

// Additional example deeplinks for testing
const examples = [
	{
		name: "Short coding session",
		params: {
			goal: "Fix bug in login component",
			categories: "coding,bugfix",
			duration: "1800", // 30 minutes
			mode: "block",
			tag: "coding",
		},
	},
	{
		name: "Long work session",
		params: {
			goal: "Complete quarterly report",
			categories: "work,reporting",
			duration: "7200", // 2 hours
			mode: "block",
			tag: "work",
		},
	},
	{
		name: "No duration session",
		params: {
			goal: "Read documentation",
			categories: "learning,docs",
			mode: "block",
			tag: "learning",
		},
	},
];

console.log("Example deeplinks for testing:");
console.log("");

examples.forEach((example, index) => {
	const exampleDeeplink = `raycast://extensions/pedropini/focus/start-session-with-tag?arguments=${encodeURIComponent(JSON.stringify(example.params))}`;
	console.log(`${index + 1}. ${example.name}:`);
	console.log(`   ${exampleDeeplink}`);
	console.log("");
});
