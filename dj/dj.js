// diskevich page: the YouTube and SoundCloud players. Nothing third-party loads until a click.
(() => {
  // YouTube: the button holds a local thumbnail; a click swaps in the no-cookie player
  const yt = document.querySelector(".yt-play");
  if (yt) yt.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.title = yt.getAttribute("aria-label").replace(/^Play video: /, "");
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.src = `https://www.youtube-nocookie.com/embed/${yt.dataset.video}?autoplay=1&rel=0`;
    yt.replaceWith(iframe);
    iframe.focus();
  });

  // SoundCloud: each top-mix card swaps its play button for that mix's player
  // (delegated, because press.js re-renders the cards from press.json)
  function playMix(btn) {
    const card = btn.closest(".mix-card");
    const iframe = document.createElement("iframe");
    iframe.title = btn.getAttribute("aria-label").replace(/^Play /, "") + " on SoundCloud";
    iframe.allow = "autoplay";
    iframe.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(btn.dataset.url) +
      "&color=%23ff6a2b&auto_play=true&hide_related=true&show_comments=false&show_user=true&visual=true";
    card.replaceChildren(iframe);
    card.classList.add("loaded");
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".mix-play");
    if (btn) { playMix(btn); return; }
    // "Play the mixes" in the hero starts the most played one
    const hero = e.target.closest("[data-play]");
    if (hero) {
      const first = document.querySelector(".mix-play");
      if (first) playMix(first);
    }
  });
})();
