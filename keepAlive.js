import http from "http";

export default function startHttpServer() {
  http
    .createServer(function(req, res) {
      res.write("I'm alive");
      res.end();
    })
    .listen(process.env.PORT || 3000);
}
