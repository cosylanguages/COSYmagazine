/**
 * Which posts go live in a build.
 *
 * A post is live when it is not a draft AND its optional `publishAt` date
 * (YYYY-MM-DD, UTC) is today or earlier. A post with a future `publishAt` is
 * held back exactly like a draft until that date; the scheduled workflow
 * (.github/workflows/scheduled-release.yml) rebuilds daily and releases it.
 */
'use strict';

function todayUTC(now) {
  return (now || new Date()).toISOString().slice(0, 10);
}

function isScheduledForFuture(post, today) {
  return !!(post && !post.draft && post.publishAt && post.publishAt > (today || todayUTC()));
}

function isLive(post, today) {
  return !!post && !post.draft && !isScheduledForFuture(post, today);
}

module.exports = { todayUTC, isScheduledForFuture, isLive };
