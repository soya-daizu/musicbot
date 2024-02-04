import ytdl from "ytdl-core";
import ytpl from "ytpl";
import SpottyDL from "spottydl";

const spotifyRegex =
  /^https:\/\/open\.spotify\.com\/(.+\/)*(track|album|playlist)\/([a-zA-Z0-9]+).*$/;

export default async function resolveUrl(url) {
  let spotifyResult;
  const items = [];

  if (ytdl.validateURL(url)) items.push([ytdl.getURLVideoID(url), {}]);
  else if (ytpl.validateID(url)) {
    const playlist = await ytpl(url);
    items.push(...playlist.items.map((item) => [item.id, {}]));
  } else if ((spotifyResult = spotifyRegex.exec(url)) !== null) {
    const [, , type, id] = spotifyResult;

    const properUrl = `https://open.spotify.com/${type}/${id}`;
    if (type === "track") {
      const track = await SpottyDL.getTrack(properUrl);
      items.push([
        track.id,
        {
          url: properUrl,
          title: track.title,
          artist: track.artist,
          thumbnail: track.albumCoverURL,
        },
      ]);
    } else if (type === "album") {
      const album = await SpottyDL.getAlbum(properUrl);
      items.push(
        ...album.tracks.map((track) => [
          track.id,
          {
            url: properUrl,
            // 本来はtitleに楽曲名が格納されているはずだが、何故かnameに格納されている
            title: track.title || track.name,
            artist: album.artist,
            thumbnail: album.albumCoverURL,
          },
        ])
      );
    } else if (type === "playlist") {
      const playlist = await SpottyDL.getPlaylist(properUrl);
      items.push(
        ...playlist.tracks.map((track) => [
          track.id,
          {
            url: properUrl,
            title: track.title,
            artist: track.artist,
            thumbnail: track.albumCoverURL,
          },
        ])
      );
    } else return;
  }

  const infos = await Promise.all(
    items.map(([videoId, overrideParams]) => getInfo(videoId, overrideParams))
  );
  return infos.filter(Boolean);
}

async function getInfo(videoId, overrideParams) {
  // Remove undefined fields
  Object.keys(overrideParams).forEach(
    (key) => overrideParams[key] === undefined && delete overrideParams[key]
  );

  const info = await ytdl.getInfo(videoId).catch(() => null);
  if (!info) return;
  return {
    videoId,
    url: info.videoDetails["video_url"],
    sourceUrl: info.videoDetails["video_url"],
    title: info.videoDetails.title,
    artist: info.videoDetails.author.name,
    length: info.videoDetails.lengthSeconds * 1000,
    thumbnail: info.videoDetails.thumbnails[0]?.url,
    ...overrideParams,
  };
}
