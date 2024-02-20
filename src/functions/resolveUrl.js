import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import YTMusic from "ytmusic-api";
import { Spotifly } from "spotifly";

const ytmusic = new YTMusic.default();
await ytmusic.initialize();
const sp = new Spotifly();

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

    if (type === "track") {
      items.push(await resolveSpotifyTrack(type, id));
    } else if (type === "album") {
      items.push(...(await resolveSpotifyAlbum(type, id)));
    } else if (type === "playlist") {
      items.push(...(await resolveSpotifyPlaylist(type, id)));
    } else return;
  }

  const infos = await Promise.all(
    items.map(([videoId, overrideParams]) => getInfo(videoId, overrideParams))
  );
  return infos.filter(Boolean);
}

function makeProperUrl(type, id) {
  return `https://open.spotify.com/${type}/${id}`;
}

async function resolveSpotifyTrack(type, id) {
  const track = await sp.getTrack(id);
  const trackInfo = {
    url: makeProperUrl(type, id),
    title: track.data.trackUnion.name,
    artist: track.data.trackUnion.artistsWithRoles.items
      .map((i) => i.artist.profile.name)
      .join(", "),
    thumbnail: track.data.trackUnion.albumOfTrack.coverArt.sources[0].url,
  };
  const searchResult = await ytmusic.searchSongs(
    `${trackInfo.title} - ${trackInfo.artist}`
  );

  return [searchResult[0].videoId, trackInfo];
}

async function resolveSpotifyAlbum(type, id) {
  const album = await sp.getAlbum(id);
  const albumInfo = {
    url: makeProperUrl(type, id),
    title: album.data.albumUnion.name,
    artist: album.data.albumUnion.artists.items
      .map((i) => i.profile.name)
      .join(", "),
    thumbnail: album.data.albumUnion.coverArt.sources[0].url,
  };
  const searchResult = await ytmusic.searchAlbums(
    `${albumInfo.title} - ${albumInfo.artist}`
  );
  const playlist = await ytpl(searchResult[0].playlistId);

  const items = await Promise.all(
    album.data.albumUnion.tracks.items.map(async ({ track }, i) => {
      const trackInfo = {
        url: makeProperUrl(type, id),
        title: track.name,
        artist: track.artists.items.map((i) => i.profile.name).join(", "),
        thumbnail: album.data.albumUnion.coverArt.sources[0].url,
      };

      return [playlist.items[i].id, trackInfo];
    })
  );

  return items;
}

async function resolveSpotifyPlaylist(type, id) {
  const playlist = await sp.getPlaylist(id);
  const items = await Promise.all(
    playlist.data.playlistV2.content.items.map(async ({ item }) => {
      const trackInfo = {
        url: makeProperUrl(type, id),
        title: item.data.name,
        artist: item.data.artists.items.map((i) => i.profile.name).join(", "),
        thumbnail: item.data.albumOfTrack.coverArt.sources[0].url,
      };
      const searchResult = await ytmusic.searchSongs(
        `${trackInfo.title} - ${trackInfo.artist}`
      );

      return [searchResult[0].videoId, trackInfo];
    })
  );

  return items;
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
