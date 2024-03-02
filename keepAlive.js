import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.send("I'm alive!");
})

export default function startServer() {
  app.listen(process.env.PORT || 3000);
}
