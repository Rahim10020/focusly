/**
 * @fileoverview How to Use documentation page for the Focusly application.
 * Comprehensive guide covering all features including Pomodoro technique,
 * task management, calendar, analytics, achievements, and keyboard shortcuts.
 * @module app/how-to-use/page
 */

'use client';

import Link from 'next/link';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

/**
 * How to Use page component providing comprehensive user documentation.
 * Includes sections on getting started, app tour, task management,
 * timer controls, calendar, analytics, achievements, and keyboard shortcuts.
 *
 * @returns {JSX.Element} The rendered documentation page
 */
export default function HowToUsePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className='sticky top-8 float-right z-50 bg-background/80 backdrop-blur-sm'>
                    <ThemeToggle />
                </div>

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-4">How to Use Focusly</h1>
                        <p className="text-lg text-muted-foreground">
                            Your complete guide to mastering productivity with the Pomodoro Technique
                        </p>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Main Content */}
                    <div className="flex-1 w-full">

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
                                        <strong>Focusly</strong> is a modern productivity workspace built on the Pomodoro Technique. It mixes a focused timer, a rich task manager, analytics, social features, and gentle reminders so you always know what to do next.
                                    </p>
                                    <p>
                                        The <strong>Pomodoro Technique</strong> splits your day into short, deep-work blocks (usually 25 minutes) with small breaks in between. Focusly keeps the timer running, links it to your active task, and records every session automatically.
                                    </p>
                                    <p>
                                        Beyond the timer, the app gives you calendar planning, exportable dashboards, achievements, friend tracking, and a clean Settings page so you can personalize the whole experience.
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

                        {/* App Tour */}
                        <section id="app-tour" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>🧭</span> Quick App Tour
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>Each page focuses on one part of your workflow:</p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Home:</strong> Timer + next tasks + mini stats.</li>
                                        <li><strong>Tasks:</strong> Full list with priorities, tags, and drag & drop order.</li>
                                        <li><strong>Create Task:</strong> Detailed form with domains, scheduling, and notes.</li>
                                        <li><strong>Calendar:</strong> Month view that shows start dates, due dates, and reminders.</li>
                                        <li><strong>Dashboard:</strong> Advanced charts plus CSV/PDF/iCal export buttons.</li>
                                        <li><strong>Stats:</strong> Tabs for overview, achievements, task history, and domain balance.</li>
                                        <li><strong>Friends:</strong> Accept requests and jump to each profile.</li>
                                        <li><strong>Leaderboard:</strong> Compare completed tasks, focus time, or streaks.</li>
                                        <li><strong>Notifications:</strong> Auto-generated alerts for overdue, due-today, and completed work.</li>
                                        <li><strong>Profile:</strong> Update your avatar, name, and see personal totals.</li>
                                        <li><strong>Settings:</strong> Tune timers, auto-start, focus sounds, and theme.</li>
                                    </ul>
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
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Keep every idea in the Tasks page. Use the quick input for small todos or the Create Task form when you need priorities, notes, or scheduling details.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Quick Add & drag-and-drop:</strong> Capture thoughts fast, then reorder them by urgency.</li>
                                        <li><strong>Priorities & tags:</strong> Color badges make it obvious what is High, Medium, or Low and which project it belongs to.</li>
                                        <li><strong>Scheduling:</strong> Add start date/time, due date, estimated duration, or even export everything to your calendar later.</li>
                                        <li><strong>Sub-tasks:</strong> Split a big goal into steps and tick them off without leaving the modal.</li>
                                        <li><strong>Domains & focus estimates:</strong> Classify tasks by life area and store how many Pomodoros you expect them to take.</li>
                                        <li><strong>Set Active:</strong> Link one task to the timer so every session is logged against real work.</li>
                                        <li><strong>History:</strong> Completed and failed items are stored for reporting in the Stats page.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Timer Controls */}
                        <section id="timer-controls" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>⏱️</span> Pomodoro Timer & Focus Tools
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        The timer sits on the Home page so you can start a focus block from anywhere. Pick the active task, press play, and Focusly does the rest.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Simple controls:</strong> Play/Pause, Skip, and Reset buttons are always visible (and mapped to keyboard shortcuts).</li>
                                        <li><strong>Auto-start:</strong> Turn on automatic work/break transitions in Settings to stay in flow.</li>
                                        <li><strong>Session logging:</strong> Every finished block is saved, including which task you were working on.</li>
                                        <li><strong>Sounds & notifications:</strong> Choose subtle chimes for work start/end so you never miss a break.</li>
                                        <li><strong>Visual ring:</strong> The progress circle shows how much time is left at a glance.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Calendar */}
                        <section id="calendar" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>🗓️</span> Calendar & Scheduling
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Open the Calendar page to see every task laid out across the month. It is perfect for spotting busy days and balancing your week.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Color-coded cards:</strong> Quickly identify overdue tasks, upcoming deadlines, and items with a start date.</li>
                                        <li><strong>Task modal:</strong> Click any card to edit notes, add sub-tasks, or complete it without leaving the calendar.</li>
                                        <li><strong>Scheduling data:</strong> Start time, estimated duration, and domains appear so you can plan mornings vs evenings.</li>
                                        <li><strong>Export:</strong> Use the Dashboard export buttons to save everything as an .ics file and drop it into Google Calendar.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Productivity Tracking */}
                        <section id="analytics" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>📊</span> Analytics & Dashboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Numbers live in two places: the Dashboard and the Stats page. Use them together to understand trends and share reports.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Stats overview:</strong> Total focus time, completed tasks, streak, and today’s progress appear on every major page.</li>
                                        <li><strong>Charts:</strong> Weekly activity, domain balance, and advanced productivity graphs help you see when you work best.</li>
                                        <li><strong>Task history:</strong> Review what was completed or missed along with the tags that were involved.</li>
                                        <li><strong>Exports:</strong> Download CSV or PDF reports, or grab an iCal file to sync tasks with other tools.</li>
                                        <li><strong>Insights:</strong> The Dashboard gives plain-language tips like “Peak performance” or “Balance suggestion.”</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Achievements */}
                        <section id="achievements" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>🏆</span> Achievements & Motivation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Focusly rewards consistent effort. Notifications pop up the moment you unlock something new.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Achievement list:</strong> Visit the Stats page → “Achievements” tab to see what is unlocked and what is left.</li>
                                        <li><strong>Categories:</strong> Earn badges for total Pomodoros, completed tasks, streak length, and focus hours.</li>
                                        <li><strong>Progress bars:</strong> Locked achievements show a progress bar so you know how close you are.</li>
                                        <li><strong>Streaks:</strong> Daily streak counters appear on the home dashboard and inside your profile.</li>
                                        <li><strong>Celebratory toasts:</strong> Achievement cards slide in at the bottom-right when you hit a milestone.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Friends & Leaderboard */}
                        <section id="friends" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>🤝</span> Friends & Leaderboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Stay accountable by bringing friends into Focusly or by chasing the top of the global leaderboard.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Friend requests:</strong> Accept or reject invitations, then jump to any profile in one click.</li>
                                        <li><strong>Profile view:</strong> Each user page shows their avatar, focus stats, domain mix, and streak.</li>
                                        <li><strong>Leaderboard tabs:</strong> Switch between Completed Tasks, Focus Time, or Day Streak rankings.</li>
                                        <li><strong>Podium:</strong> The top three users get a special highlight, while everyone else can scroll or paginate.</li>
                                        <li><strong>Navigation shortcuts:</strong> Use keyboard shortcuts or header links to hop between Friends, Leaderboard, and user profiles.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Notifications */}
                        <section id="notifications" className="mb-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>🔔</span> Notifications & Reminders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        The Notifications page keeps you informed, and browser alerts let you know when timers end.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Auto-generated feed:</strong> See overdue tasks, due-today items, recently completed work, and achievement pings.</li>
                                        <li><strong>Filters:</strong> Switch between All and Unread to focus on what still needs attention.</li>
                                        <li><strong>Mark as read:</strong> Clear single cards or hit “Mark all as read” when you are caught up.</li>
                                        <li><strong>Task notifications:</strong> Focusly can request browser permission to remind you about upcoming work sessions.</li>
                                        <li><strong>Sounds:</strong> Choose subtle audio cues for timer transitions inside Settings.</li>
                                    </ul>
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
                                <CardContent className="space-y-4 text-muted-foreground">
                                    <p>
                                        Build a setup that matches your rhythm. The Settings page saves everything locally, so your preferences load instantly each visit.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Timer presets:</strong> Change work, short break, and long break lengths plus the number of cycles per round.</li>
                                        <li><strong>Auto-start & sounds:</strong> Decide whether the next session starts on its own and toggle Focusly’s built-in chimes.</li>
                                        <li><strong>Theme switch:</strong> Use the header toggle for Light/Dark or let Focusly follow your system preference.</li>
                                        <li><strong>Reset button:</strong> One click resets all settings to the recommended defaults.</li>
                                        <li><strong>Profile tweaks:</strong> Update your avatar, display name, and email from the Profile page whenever you want.</li>
                                    </ul>
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
                        <div className="text-center mt-12">
                            <Link href="/">
                                <Button variant="secondary">
                                    ← Back to Focusly
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Table of Contents - Right Sidebar */}
                    <div className="hidden md:block w-64 flex-shrink-0">
                        <div className="sticky top-8">
                            <Card className="p-4">
                                <h3 className="font-semibold mb-3">Table of Contents</h3>
                                <nav className="space-y-2">
                                    <a href="#introduction" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🚀 Introduction</a>
                                    <a href="#getting-started" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🎯 Getting Started</a>
                                    <a href="#app-tour" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🧭 App Tour</a>
                                    <a href="#tasks-management" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">📋 Tasks & Planning</a>
                                    <a href="#timer-controls" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">⏱️ Pomodoro Timer</a>
                                    <a href="#calendar" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🗓️ Calendar & Schedule</a>
                                    <a href="#analytics" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">📊 Analytics & Dashboard</a>
                                    <a href="#achievements" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🏆 Achievements</a>
                                    <a href="#friends" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🤝 Friends & Leaderboard</a>
                                    <a href="#notifications" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🔔 Notifications</a>
                                    <a href="#customization" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">🎨 Customization</a>
                                    <a href="#tips" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">💡 Tips & Best Practices</a>
                                    <a href="#shortcuts" className="block text-sm text-primary hover:underline transition-all duration-200 hover:text-primary/80">⌨️ Keyboard Shortcuts</a>
                                </nav>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}