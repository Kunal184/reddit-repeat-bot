const ALERT_COOLDOWN_MS = 60 * 60 * 1000;
const recentAlerts = new Map<string, number>();

export type AlertParams = {
  subreddit: string;
  username: string;
  commentId: string;
  commentBody: string;
  repeatCount: number;
  examples: { id: string; body: string }[];
  alertType: string;
};

export async function sendModAlert(reddit: any, params: AlertParams): Promise<void> {
  const { subreddit, username, commentId, commentBody, repeatCount, examples, alertType } = params;

  const lastAlert = recentAlerts.get(username);
  if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN_MS) return;
  recentAlerts.set(username, Date.now());

  if (alertType === 'report') {
    try {
      const comment = await reddit.getCommentById(commentId);
      await reddit.report(comment, {
        reason: `CommentBotCatcher: u/${username} posted ${repeatCount} similar comments in the last 30 days`,
      });
    } catch (err) {
      console.error('Report failed:', err);
    }
    return;
  }

  const exampleLines = examples
    .map((c, i) => `**Example ${i + 1}:** "${c.body}" (t1_${c.id})`)
    .join('\n\n');

  try {
    await reddit.sendPrivateMessage({
      to: subreddit,
      subject: `[CommentBotCatcher] u/${username} flagged for repetitive comments`,
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
  } catch (err) {
    console.error('Modmail failed:', err);
  }
}