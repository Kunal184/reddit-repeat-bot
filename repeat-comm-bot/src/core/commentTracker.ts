const MAX_COMMENTS_PER_USER = 50;
const REDIS_PREFIX = 'repeat_bot:comments:';

export type StoredComment = {
  id: string;
  body: string;
  postId: string;
  timestamp: number;
};

export type CheckParams = {
  username: string;
  commentBody: string;
  commentId: string;
  postId: string;
  similarityThreshold: number;
  windowDays: number;
};

export type CheckResult = {
  repeatCount: number;
  matchedComments: StoredComment[];
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function similarity(a: string, b: string, threshold: number): number {
  // At 100%, require exact match including punctuation and casing
  if (threshold === 100) {
    return a.trim() === b.trim() ? 100 : 0;
  }

  const normA = normalize(a);
  const normB = normalize(b);
  if (normA === normB) return 100;
  if (normA.length < 2 || normB.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) bigrams.add(str.slice(i, i + 2));
    return bigrams;
  };

  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);
  let intersection = 0;
  for (const bigram of bigramsA) if (bigramsB.has(bigram)) intersection++;
  return Math.round((2 * intersection / (bigramsA.size + bigramsB.size)) * 100);
}

export async function checkRepeatComment(
  redis: any,
  params: CheckParams
): Promise<CheckResult> {
  const { username, commentBody, postId, similarityThreshold, windowDays } = params;
  const key = `${REDIS_PREFIX}${username}`;
  const raw = await redis.get(key);
  const past: StoredComment[] = raw ? JSON.parse(raw) : [];
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const matched: StoredComment[] = [];

  for (const p of past) {
    if (p.timestamp < cutoff) continue;
    if (p.postId === postId) continue;
    if (similarity(commentBody, p.body, similarityThreshold) >= similarityThreshold) matched.push(p);
  }

  return { repeatCount: matched.length, matchedComments: matched.slice(0, 5) };
}

export async function storeComment(
  redis: any,
  comment: StoredComment & { username: string }
): Promise<void> {
  const key = `${REDIS_PREFIX}${comment.username}`;
  const raw = await redis.get(key);
  const past: StoredComment[] = raw ? JSON.parse(raw) : [];
  past.push({ id: comment.id, body: comment.body, postId: comment.postId, timestamp: comment.timestamp });
  const trimmed = past.slice(-MAX_COMMENTS_PER_USER);
  await redis.set(key, JSON.stringify(trimmed));
}