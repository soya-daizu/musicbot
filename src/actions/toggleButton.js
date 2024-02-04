import toggle from "../commands/toggle.js";

export default {
  data: { name: "toggleButton" },
  execute: toggle.execute,
};
