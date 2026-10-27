/**
 * Podcast embed resolver (ES module).
 * One place that turns "a link to an episode" into "an embeddable player", used by both
 * the static build (scripts/build-blog.js) and the browser (js/podcast-box.js).
 *
 * Authors only need to paste ONE link into the post JSON:
 *   "podcast": { "episode": 4, "externalUrl": "https://open.spotify.com/episode/..." }
 * or set "iframeUrl" when they already have an embed address.
 *
 * Supported: Spotify (episode / show), Spotify for Podcasters (ex-Anchor), Apple Podcasts,
 * Mave, YouTube. Anything else returns null (the page then shows the honest
 * "recording in production" notice instead of a broken player).
 */

const TRUSTED_EMBED_HOSTS = [
  'open.spotify.com',
  'podcasters.spotify.com',
  'anchor.fm',
  'embed.podcasts.apple.com',
  'player.mave.digital',
  'www.youtube.com',
  'www.youtube-nocookie.com'
];

function safeUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    return u.protocol === 'https:' ? u : null;
  } catch (e) {
    return null;
  }
}

/**
 * @param {string} link  any episode link (page link or embed link)
 * @returns {{ src: string, height: number, provider: string } | null}
 */
export function resolveEmbed(link) {
  if (!link) return null;
  const u = safeUrl(link);
  if (!u) return null;
  const host = u.hostname.replace(/^m\./, '');
  const parts = u.pathname.split('/').filter(Boolean);

  // Spotify
  if (host === 'open.spotify.com') {
    const kind = parts[0] === 'embed' ? parts[1] : parts[0];
    const id = parts[0] === 'embed' ? parts[2] : parts[1];
    if ((kind === 'episode' || kind === 'show') && /^[A-Za-z0-9]{10,}$/.test(id || '')) {
      return { src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`, height: 152, provider: 'spotify' };
    }
    return null;
  }

  // Spotify for Podcasters (formerly Anchor): .../pod/show/<show>/episodes/<slug>
  if (host === 'podcasters.spotify.com' || host === 'anchor.fm') {
    const iShow = parts.indexOf('show');
    const base = host === 'anchor.fm' ? parts : parts.slice(iShow >= 0 ? iShow + 1 : 0);
    const show = base[0];
    const iEp = base.indexOf('episodes');
    const embedAt = base.indexOf('embed');
    const slug = base[(embedAt >= 0 && base[embedAt + 1] === 'episodes' ? embedAt + 2 : iEp + 1)];
    if (show && slug && (iEp >= 0 || embedAt >= 0)) {
      return { src: `https://podcasters.spotify.com/pod/show/${show}/embed/episodes/${slug}`, height: 152, provider: 'spotify-podcasters' };
    }
    return null;
  }

  // Apple Podcasts: needs the ?i=<episodeId> to point at an episode, not the whole show
  if (host === 'podcasts.apple.com' || host === 'embed.podcasts.apple.com') {
    return { src: `https://embed.podcasts.apple.com${u.pathname}${u.search}`, height: 175, provider: 'apple' };
  }

  // Mave (already an embeddable player address)
  if (host === 'player.mave.digital') {
    return { src: u.toString(), height: 200, provider: 'mave' };
  }

  // YouTube
  if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'youtu.be' || host === 'www.youtube-nocookie.com') {
    let id = null;
    if (host === 'youtu.be') id = parts[0];
    else if (parts[0] === 'embed') id = parts[1];
    else id = u.searchParams.get('v');
    if (/^[A-Za-z0-9_-]{6,}$/.test(id || '')) {
      return { src: `https://www.youtube-nocookie.com/embed/${id}`, height: 315, provider: 'youtube' };
    }
  }

  return null;
}

/**
 * Pick the best embed for a post's `podcast` object.
 * Order: explicit iframeUrl → externalUrl (Spotify etc.) → appleUrl.
 */
export function resolvePodcastEmbed(podcast = {}) {
  return (
    resolveEmbed(podcast.iframeUrl) ||
    resolveEmbed(podcast.externalUrl) ||
    resolveEmbed(podcast.appleUrl) ||
    null
  );
}

export { TRUSTED_EMBED_HOSTS };
