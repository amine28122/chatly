/**
 * BotCraft AI — self-hosted widget loader.
 * Usage:
 *   <script src="https://YOUR_APP/widget.js" data-bot-id="bot-luxury-01" async></script>
 * It mounts a floating iframe powered by the app's standalone embed route.
 */
(function () {
  function resolveBaseUrl(scriptEl) {
    // 1) Explicit override via data-base-url (hosted on the platform's own origin).
    var explicit = scriptEl && scriptEl.getAttribute("data-base-url");
    if (explicit) return explicit;
    // 2) Derive the platform origin from this script's own src (NOT the host page's origin).
    //    This is what makes the widget work when embedded on any customer website.
    var src = scriptEl && (scriptEl.getAttribute("src") || "");
    if (src) {
      try {
        return new URL(src, window.location.origin).origin;
      } catch (err) {
        /* fall through */
      }
    }
    return window.location.origin;
  }

  function mountWidget() {
    try {
      var script = document.currentScript;
      var botId =
        (script && (script.getAttribute("data-bot-id") || script.getAttribute("data-botId"))) ||
        "bot-luxury-01";
      var baseUrl = resolveBaseUrl(script);

      var iframe = document.createElement("iframe");
      iframe.src = baseUrl + "/embed/" + encodeURIComponent(botId) + "?embedded=1";
      iframe.setAttribute("allow", "clipboard-write");
      iframe.title = "AI Assistant";
      iframe.style.cssText =
        "position:fixed;bottom:24px;right:24px;width:420px;max-width:calc(100vw - 32px);" +
        "height:640px;max-height:calc(100vh - 32px);border:0;border-radius:24px;" +
        "box-shadow:0 20px 60px rgba(0,0,0,.35);z-index:2147483647;background:transparent;";
      iframe.setAttribute("loading", "lazy");
      document.body.appendChild(iframe);
    } catch (err) {
      // Never break the host page.
      console.warn("BotCraft widget failed to load", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();