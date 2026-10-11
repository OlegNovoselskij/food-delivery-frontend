(function applyStoredTheme() {
  var preference = "system";
  try {
    preference = window.localStorage.getItem("atrium.theme") || "system";
  } catch (error) {
    preference = "system";
  }
  var dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
