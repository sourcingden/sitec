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

  const box = document.getElementById("sc-facade");
  if (!box) return;
  function loadPlayer() {
    if (box.classList.contains("loaded")) return;
    const iframe = document.createElement("iframe");
    iframe.title = "mixes spotlight by diskevich on SoundCloud";
    iframe.allow = "autoplay";
    iframe.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent("https://soundcloud.com/diskevich/sets/mixes-highlight") +
      "&color=%23ff6a2b&auto_play=true&hide_related=true&show_comments=false&show_user=true&visual=false";
    box.replaceChildren(iframe);
    box.classList.add("loaded");
  }
  document.getElementById("sc-load").addEventListener("click", loadPlayer);
  for (const a of document.querySelectorAll("[data-play]")) a.addEventListener("click", loadPlayer);
})();
