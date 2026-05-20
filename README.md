# CommentBotCatcher

A moderation tool that automatically detects and flags users who post repetitive comments across your subreddit.

## What it does

CommentBotCatcher runs silently in the background, monitoring every comment posted in your subreddit. When a user posts the same or very similar comment across multiple posts, the app sends an alert to your mod team via modmail so you can investigate and take action.

## How it works

Every comment is stored and compared against that user's comment history. If a user posts 5 or more similar comments across different posts within a 30 day window, mods receive a modmail alert with examples of the repeated comments and a link to the latest one.

The app uses fuzzy matching to catch slight variations — so "Beautiful!" and "Beautifull!" would both count toward the same user's repeat total.

## Modmail alert

When a user is flagged you'll receive a modmail that includes:

- The username of the flagged user
- How many repeat comments were detected
- The latest comment and a direct link to it
- Up to 5 examples of previous similar comments

## Default settings

| Setting | Default | Description |
|---|---|---|
| Flag after | 5 comments | How many similar comments before alerting |
| Similarity threshold | 85% | How similar comments need to be to count |
| Window | 30 days | How far back to look |
| Min length | 5 characters | Ignore very short comments |

## Notes

- The bot ignores AutoModerator comments
- Comments on the same post don't count toward the repeat total
- Mods decide what action to take — the bot only alerts, it never removes or bans automatically