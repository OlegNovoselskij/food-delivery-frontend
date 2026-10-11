import "./styles/index.css";

requestAnimationFrame(() => {
  setTimeout(() => {
    void import("./boot");
  }, 0);
});
