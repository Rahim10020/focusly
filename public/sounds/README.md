# Sound Files Setup Guide

This directory should contain MP3 audio files for notification sounds.

## Required Files

1. **achievement.mp3** - Sound played when user earns an achievement
2. **task.mp3** - Sound played for task-related notifications
3. **friend.mp3** - Sound played for friend requests and social notifications  
4. **notification.mp3** - Default sound for general notifications

## How to Add Sound Files

1. Find or create short (1-3 second) MP3 audio files
2. Rename them according to the names above
3. Place them in this `/public/sounds/` directory
4. Remove the `.txt` placeholder files

## Free Sound Resources

You can find free notification sounds at:
- https://freesound.org/
- https://notificationsounds.com/
- https://mixkit.co/free-sound-effects/notification/

## Audio Requirements

- Format: MP3
- Duration: 1-3 seconds recommended
- File size: < 100KB per file
- Sample rate: 44.1kHz or 48kHz
- Bit rate: 128kbps or higher

## Notes

The application will gracefully handle missing sound files by silently failing, so notifications will still work even without audio.
