const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour per user
const recentAlerts = new Map<string, number>();

export type AlertParams = {
  subreddit: string;
  username: string;
  commentId: string;
  commentBody: string;
  repeatCount: number;
  examples: { id: string; body: string }[];
};

export async function sendModAlert(reddit: any, params: AlertParams): Promise<void> {
  const { subreddit, username, commentId, commentBody, repeatCount, examples } = params;

  // Don't spam mods about the same user repeatedly
  const lastAlert = recentAlerts.get(username);
  if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN_MS) return;
  recentAlerts.set(username, Date.now());

  const exampleLines = examples
    .map((c, i) => `**Example ${i + 1}:** "${c.body}" (t1_${c.id})`)
    .join('\n\n');

  await reddit.sendPrivateMessage({
    to: `/r/${subreddit}`,
    subject: `[Repeat Comment Bot] u/${username} flagged for repetitive comments`,
    text: `
## Repeat Comment Detected

**User:** u/${username}
**Repeat count:** ${repeatCount} similar comments in the last 30 days
**Latest comment:** "${commentBody}"
**Comment link:** https://reddit.com/comments/${commentId.replace('t1_', '')}

---

### Previous similar comments

${exampleLines}

---

*Adjust sensitivity in mod settings.*
    `.trim(),
  });
}