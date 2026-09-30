// diskevich page: the SoundCloud player. Nothing third-party loads until a click.
(() => {
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
