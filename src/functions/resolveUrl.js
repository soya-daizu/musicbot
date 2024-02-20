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

  if (ytdl.validateURL(url)) {
    items.push([ytdl.getURLVideoID(url), {}]);
  } else if (ytpl.validateID(url)) {
    const playlist = await ytpl(url);
    items.push(...playlist.items.map((item) => [item.id, {}]));
  } else if ((spotifyResult = spotifyRegex.exec(url)) !== null) {
    const [, , type, id] = spotifyResult;

    if (type === "track") {
      items.push(await resolveSpotifyTrack(id));
    } else if (type === "album") {
      items.push(...(await resolveSpotifyAlbum(id)));
    } else if (type === "playlist") {
      items.push(...(await resolveSpotifyPlaylist(id)));
    } else return;
  } else {
    const hash = hashCode(url);
    const urlObj = new URL(url);
    if (/\.(mp3|ogg|webm|opus|wav|flac)$/.test(urlObj.pathname))
      items.push([
        "",
        {
          videoId: `__${hash}`,
          url,
          sourceUrl: url,
          title: urlObj.pathname.split("/").at(-1),
          artist: "",
          length: 0,
          thumbnail: undefined,
          incomplete: true,
        },
      ]);
  }

  const infos = await Promise.all(
    items.map(([id, overrideParams]) => {
      if (id === "") return overrideParams;
      return fillWithYTInfo(id, overrideParams);
    })
  );
  return infos.filter(Boolean);
}

function makeProperUrl(type, id) {
  return `https://open.spotify.com/${type}/${id}`;
}

async function resolveSpotifyTrack(id) {
  const track = await sp.getTrack(id);
  const trackInfo = {
    url: makeProperUrl("track", id),
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

async function resolveSpotifyAlbum(id) {
  const album = await sp.getAlbum(id);
  const albumInfo = {
    url: makeProperUrl("album", id),
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
        url: makeProperUrl("album", id),
        title: track.name,
        artist: track.artists.items.map((i) => i.profile.name).join(", "),
        thumbnail: album.data.albumUnion.coverArt.sources[0].url,
      };

      return [playlist.items[i].id, trackInfo];
    })
  );

  return items;
}

async function resolveSpotifyPlaylist(id) {
  const playlist = await sp.getPlaylist(id);

  const items = await Promise.all(
    playlist.data.playlistV2.content.items.map(async ({ item }) => {
      const trackInfo = {
        url: makeProperUrl("playlist", id),
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

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

async function fillWithYTInfo(videoId, overrideParams) {
  // Remove undefined fields
  Object.keys(overrideParams).forEach(
    (key) => overrideParams[key] === undefined && delete overrideParams[key]
  );

  if (videoId) {
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
}
