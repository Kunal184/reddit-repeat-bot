import { Hono } from 'hono';
import type { OnCommentSubmitRequest, TriggerResponse } from '@devvit/web/shared';
import { reddit, redis, settings } from '@devvit/web/server';
import { checkRepeatComment, storeComment } from '../core/commentTracker';
import { sendModAlert } from '../core/modAlert';

export const triggers = new Hono();

const WINDOW_DAYS = 30;
const MIN_COMMENT_LENGTH = 5;

triggers.post('/on-app-install', async (c) => {
  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/on-comment-submit', async (c) => {
  const input = await c.req.json<OnCommentSubmitRequest>();

  const comment = input.comment;
  const author = input.author;
  const subreddit = input.subreddit;

  if (!comment || !author || !subreddit) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (author.name === 'AutoModerator') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (comment.body.trim().length < MIN_COMMENT_LENGTH) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const similarityRaw = await settings.get('similarityThreshold');
  const similarityThreshold = Number(Array.isArray(similarityRaw) ? similarityRaw[0] : (similarityRaw ?? 100));

  const alertTypeRaw = await settings.get('alertType');
  const alertType = String(Array.isArray(alertTypeRaw) ? alertTypeRaw[0] : (alertTypeRaw ?? 'report'));

  const flagAfterRaw = await settings.get('flagAfterCount');
  const flagAfterCount = Number(Array.isArray(flagAfterRaw) ? flagAfterRaw[0] : (flagAfterRaw ?? 5));

  const result = await checkRepeatComment(redis, {
    username: author.name,
    commentBody: comment.body,
    commentId: comment.id,
    postId: comment.postId,
    similarityThreshold,
    windowDays: WINDOW_DAYS,
  });

  await storeComment(redis, {
    username: author.name,
    id: comment.id,
    body: comment.body,
    postId: comment.postId,
    timestamp: Date.now(),
  });

  if (result.repeatCount >= flagAfterCount) {
    await sendModAlert(reddit, {
      subreddit: subreddit.name,
      username: author.name,
      commentId: comment.id,
      commentBody: comment.body,
      repeatCount: result.repeatCount,
      examples: result.matchedComments,
      alertType,
    });
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});