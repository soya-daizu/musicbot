import shuffle from "../commands/shuffle.js";

export default {
  data: { name: "shuffleButton" },
  execute: shuffle.execute,
};
