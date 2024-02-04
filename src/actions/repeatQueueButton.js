import repeatQueue from "../commands/repeatQueue.js";

export default {
  data: { name: "repeatQueueButton" },
  execute: repeatQueue.execute,
};
