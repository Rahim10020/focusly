'use client';

import Link from 'next/link';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HowToUsePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-4">How to Use Focusly</h1>
                    <p className="text-lg text-muted-foreground">
                        Your complete guide to mastering productivity with the Pomodoro Technique
                    </p>
                </div>

                {/* Table of Contents */}
                <div className="sticky top-20 mb-8">
                    <Card className="p-4">
                        <h3 className="font-semibold mb-2">Table of Contents</h3>
                        <nav className="space-y-1">
                            <a href="#introduction" className="block text-sm text-primary hover:underline">Introduction</a>
                            <a href="#getting-started" className="block text-sm text-primary hover:underline">Getting Started</a>
                            <a href="#tasks-management" className="block text-sm text-primary hover:underline">Tasks Management</a>
                            <a href="#timer-controls" className="block text-sm text-primary hover:underline">Timer Controls</a>
                            <a href="#productivity-tracking" className="block text-sm text-primary hover:underline">Productivity Tracking</a>
                            <a href="#customization" className="block text-sm text-primary hover:underline">Customization</a>
                            <a href="#tips" className="block text-sm text-primary hover:underline">Tips & Best Practices</a>
                            <a href="#shortcuts" className="block text-sm text-primary hover:underline">Keyboard Shortcuts</a>
                        </nav>
                    </Card>
                </div>

                {/* Introduction */}
                <section id="introduction" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>🚀</span> Introduction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>
                                <strong>Focusly</strong> is a modern productivity app that helps you stay focused and get more done using the proven Pomodoro Technique.
                            </p>
                            <p>
                                The <strong>Pomodoro Technique</strong> is a time management method that breaks work into focused intervals (typically 25 minutes) called "Pomodoros," separated by short breaks. This helps maintain concentration and prevents burnout.
                            </p>
                            <p>
                                With Focusly, you can manage your tasks, track your productivity, and build better work habits through gamification and detailed statistics.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Getting Started */}
                <section id="getting-started" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>🎯</span> Getting Started
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Create a Task</h3>
                                <p className="text-muted-foreground mb-3">
                                    Start by creating your first task. Click the "Add Task" button and give it a clear, actionable title.
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Use specific titles like "Write project proposal" instead of "Work"</li>
                                    <li>Add priority levels to organize your work</li>
                                    <li>Set due dates to create urgency</li>
                                    <li>Use tags to categorize tasks by project or type</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Start the Timer</h3>
                                <p className="text-muted-foreground mb-3">
                                    Select a task from your list and click the play button to start a Pomodoro session.
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>The timer will run for 25 minutes of focused work</li>
                                    <li>You'll hear a notification when the work session ends</li>
                                    <li>Take a 5-minute break before starting the next Pomodoro</li>
                                    <li>After 4 Pomodoros, take a longer 15-30 minute break</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Understand the Cycle</h3>
                                <p className="text-muted-foreground">
                                    Each complete cycle consists of 4 work sessions and breaks. The app will guide you through this process automatically.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Tasks Management */}
                <section id="tasks-management" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>📋</span> Tasks Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Priorities</h3>
                                <p className="text-muted-foreground">
                                    Set priority levels (High, Medium, Low) to focus on what matters most. High priority tasks appear first in your list.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                                <p className="text-muted-foreground">
                                    Organize tasks with custom tags. Create tags for different projects, clients, or categories to keep everything organized.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Due Dates</h3>
                                <p className="text-muted-foreground">
                                    Set deadlines to create urgency and stay on track. Tasks with approaching due dates are highlighted.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Sub-tasks</h3>
                                <p className="text-muted-foreground">
                                    Break down complex tasks into smaller, manageable sub-tasks. Track progress as you complete each part.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Timer Controls */}
                <section id="timer-controls" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>⏱️</span> Timer Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Start/Pause</h3>
                                <p className="text-muted-foreground">
                                    Use the play/pause button to control your work sessions. Pause if you need a quick break without losing progress.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Skip</h3>
                                <p className="text-muted-foreground">
                                    Skip to the next phase if you need to adjust your timing. This is useful if you finish early or need more time.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Reset</h3>
                                <p className="text-muted-foreground">
                                    Reset the current session if you get interrupted or need to start over. Your progress won't be lost.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Productivity Tracking */}
                <section id="productivity-tracking" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>📊</span> Productivity Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                                <p className="text-muted-foreground">
                                    View detailed stats about your productivity, including total Pomodoros completed, time spent working, and daily/weekly trends.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                                <p className="text-muted-foreground">
                                    Unlock achievements as you build productive habits. Celebrate milestones like completing your first week or reaching 100 Pomodoros.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Streaks</h3>
                                <p className="text-muted-foreground">
                                    Build and maintain daily work streaks. Stay motivated by seeing how many consecutive days you've been productive.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Customization */}
                <section id="customization" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>🎨</span> Customization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Settings</h3>
                                <p className="text-muted-foreground">
                                    Customize your experience in the Settings page. Adjust timer durations, notification preferences, and more.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Auto-start</h3>
                                <p className="text-muted-foreground">
                                    Enable auto-start to automatically begin breaks and work sessions, keeping your flow uninterrupted.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Dark Mode</h3>
                                <p className="text-muted-foreground">
                                    Switch between light and dark themes using the toggle in the header. Choose what works best for your environment.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Tips & Best Practices */}
                <section id="tips" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>💡</span> Tips & Best Practices
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Start your day by planning 3-5 key tasks to focus on</li>
                                <li>Group similar tasks together to maintain focus</li>
                                <li>Use breaks to stretch, hydrate, or do quick exercises</li>
                                <li>Review your completed Pomodoros at the end of each day</li>
                                <li>Don't multitask during a Pomodoro - focus on one thing</li>
                                <li>Adjust timer lengths if 25 minutes feels too long or short</li>
                                <li>Celebrate small wins and completed tasks</li>
                                <li>Be consistent - even 2-3 Pomodoros per day can make a difference</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Keyboard Shortcuts */}
                <section id="shortcuts" className="mb-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>⌨️</span> Keyboard Shortcuts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Speed up your workflow with these keyboard shortcuts. Press <kbd className="px-2 py-1 bg-muted rounded text-sm">?</kbd> anywhere in the app to see the full list.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Timer Controls</h3>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li><kbd className="px-2 py-1 bg-muted rounded">Space</kbd> - Start/Pause timer</li>
                                        <li><kbd className="px-2 py-1 bg-muted rounded">S</kbd> - Skip to next phase</li>
                                        <li><kbd className="px-2 py-1 bg-muted rounded">R</kbd> - Reset timer</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Tasks</h3>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li><kbd className="px-2 py-1 bg-muted rounded">N</kbd> - New task</li>
                                        <li><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> - Select task</li>
                                        <li><kbd className="px-2 py-1 bg-muted rounded">Delete</kbd> - Delete task</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Back to Home */}
                <div className="text-center">
                    <Link href="/">
                        <Button variant="secondary">
                            ← Back to Focusly
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}