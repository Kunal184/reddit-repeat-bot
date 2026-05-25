# CommentSpamBot

A Reddit moderation tool that automatically detects and flags users who post repetitive comments across your subreddit.

## What it does

CommentSpamBot runs silently in the background, monitoring every comment posted in your subreddit. When a user posts the same or very similar comment across multiple posts, the app alerts your mod team so you can investigate and take action.

## How it works

Every comment is stored and compared against that user's comment history. When a user hits the configured threshold of similar comments within the last 30 days, mods receive either a modmail or a mod queue report depending on your settings.

Comments on the same post are ignored — only comments across different posts count toward the threshold.

## Mod settings

All settings are configurable per subreddit from the app's settings page.

| Setting | Default | Description |
|---|---|---|
| Alert Type | Report to mod queue | Whether to send modmail or report to the mod queue |
| Similarity Threshold | 100 | How similar comments need to be (0-100). 100 = exact match including punctuation |
| Flag after count | 5 | How many similar comments before alerting |

## Notes

- AutoModerator comments are ignored
- Comments shorter than 5 characters are ignored
- Comments on the same post don't count toward the repeat total
- Mods decide what action to take — the bot only alerts, it never removes or bans automatically
- A user will only trigger one alert per hour to avoid modmail spam