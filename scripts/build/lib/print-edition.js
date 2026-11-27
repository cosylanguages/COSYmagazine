/**
 * Select the posts that belong in one printed edition.
 *
 * A hub article and its same-language translation are one piece: the English
 * edition ships both `top-10-verbs` and `top-10-verbs-en`, for example. Keep
 * the hub (the post without `translationOf`) and drop the twin so the sold PDF
 * does not print the same article twice. A translation in another language is
 * kept because its hub is not in that edition.
 */
function selectEditionPosts(posts, lang) {
  const edition = posts.filter((post) => !post.draft && post.language === lang);
  const hubSlugs = new Set(
    edition.filter((post) => !post.translationOf).map((post) => post.slug)
  );
  return edition.filter((post) => !post.translationOf || !hubSlugs.has(post.translationOf));
}

module.exports = { selectEditionPosts };
