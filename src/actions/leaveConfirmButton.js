import leave from "../commands/leave.js";

export default {
  data: { name: "leaveConfirmButton" },
  execute: leave.execute,
};
