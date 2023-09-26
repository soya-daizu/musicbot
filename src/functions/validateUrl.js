import ytdl from "ytdl-core";

const spotifyRegex =
  /^https:\/\/open\.spotify\.com\/(.+\/)*track\/[a-zA-Z0-9]+.*$/;
const spotifyAlbumRegex =
  /^https:\/\/open.spotify.com\/(.+\/)*album\/[a-zA-Z0-9]+.*$/;
export default function validateUrl(url) {
  if (ytdl.validateURL(url)) {
    const videoId = ytdl.getURLVideoID(url);
    return ["youtube", videoId];
  } else if (spotifyRegex.test(url)) {
    const videoId = new URL(url).pathname.split("/").at(-1);
    return ["spotify", videoId];
  } else if (spotifyAlbumRegex.test(url)) {
    const videoId = new URL(url).pathname.split("/").at(-1);
    return ["spotifyAlbum", videoId];
  }
}
