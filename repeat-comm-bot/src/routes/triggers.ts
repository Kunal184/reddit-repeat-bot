import { Hono } from 'hono';
import type { OnCommentSubmitRequest, TriggerResponse } from '@devvit/web/shared';
import { reddit, redis } from '@devvit/web/server';
import { checkRepeatComment, storeComment } from '../core/commentTracker';
import { sendModAlert } from '../core/modAlert';

export const triggers = new Hono();

const SIMILARITY_THRESHOLD = 85;
const FLAG_AFTER_COUNT = 2;
const WINDOW_DAYS = 30;
const MIN_COMMENT_LENGTH = 5;

triggers.post('/on-app-install', async (c) => {
  console.log('Repeat Comment Bot installed!');
  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/on-comment-submit', async (c) => {
  console.log('Comment trigger fired!');
  const input = await c.req.json<OnCommentSubmitRequest>();

  const comment = input.comment;
  const author = input.author;
  const subreddit = input.subreddit;

  console.log('comment:', !!comment, 'author:', !!author, 'subreddit:', !!subreddit);
  console.log('author name:', author?.name);
  console.log('comment body:', comment?.body);
  console.log('comment length:', comment?.body?.trim().length);

  if (!comment || !author || !subreddit) {
    console.log('Early exit: missing comment, author, or subreddit');
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (author.name === 'AutoModerator') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (comment.body.trim().length < MIN_COMMENT_LENGTH) {
    console.log('Early exit: comment too short');
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const result = await checkRepeatComment(redis, {
    username: author.name,
    commentBody: comment.body,
    commentId: comment.id,
    postId: comment.postId,
    similarityThreshold: SIMILARITY_THRESHOLD,
    windowDays: WINDOW_DAYS,
  });

  console.log('Repeat count:', result.repeatCount);
  console.log('Flag threshold:', FLAG_AFTER_COUNT);

  await storeComment(redis, {
    username: author.name,
    id: comment.id,
    body: comment.body,
    postId: comment.postId,
    timestamp: Date.now(),
  });

  if (result.repeatCount >= FLAG_AFTER_COUNT) {
    await sendModAlert(reddit, {
      subreddit: subreddit.name,
      username: author.name,
      commentId: comment.id,
      commentBody: comment.body,
      repeatCount: result.repeatCount,
      examples: result.matchedComments,
    });
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});