import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import YTMusic from "ytmusic-api";
import { Spotifly } from "spotifly";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import spotifyResolveDb from "../database/spotifyResolveDb.js";

const ytmusic = new YTMusic.default();
await ytmusic.initialize({ GL: "JP", HL: "ja" });
const sp = new Spotifly();

const spotifyRegex =
  /^https:\/\/open\.spotify\.com\/(.+\/)*(track|album|playlist)\/([a-zA-Z0-9]+).*$/;

export default async function resolveUrl(url) {
  let spotifyResult;
  const items = [];

  if (ytdl.validateURL(url)) {
    items.push(await resolveYouTubeVideo(ytdl.getURLVideoID(url)));
  } else if (ytpl.validateID(url)) {
    items.push(...(await resolveYouTubePlaylist(url)));
  } else if ((spotifyResult = spotifyRegex.exec(url)) !== null) {
    const [, , type, id] = spotifyResult;

    if (type === "track") {
      items.push(await resolveSpotifyTrack(id));
    } else if (type === "album") {
      items.push(...(await resolveSpotifyAlbum(id)));
    } else if (type === "playlist") {
      items.push(...(await resolveSpotifyPlaylist(id)));
    } else return;
  }

  const infos = await Promise.all(items);
  return infos.filter(Boolean);
}

async function resolveYouTubeVideo(id) {
  const cached =
    existsSync(join("videos", id, "info.json")) &&
    existsSync(join("videos", id, "audio.webm"));
  if (cached) {
    const info = JSON.parse(readFileSync(join("videos", id, "info.json")));
    info.cached = true;
    return info;
  }

  const info = await ytdl.getInfo(id).catch(() => null);
  if (!info) return;

  return {
    videoId: id,
    url: info.videoDetails["video_url"],
    title: info.videoDetails.title,
    artist: info.videoDetails.author.name,
    length: info.videoDetails.lengthSeconds * 1000,
    thumbnail: info.videoDetails.thumbnails[0]?.url,
  };
}

async function resolveYouTubePlaylist(id) {
  const playlist = await ytpl(id);

  return playlist.items.map((item) => resolveYouTubeVideo(item.url));
}

function makeProperSpotifyUrl(uri) {
  const [, type, id] = uri.split(":");
  return `https://open.spotify.com/${type}/${id}`;
}

async function resolveSpotifyTrackData(spotifyTrack) {
  const searchResult = await ytmusic.searchSongs(
    `${spotifyTrack.title} - ${spotifyTrack.artist}`
  );
  const { ytmSong: bestMatch } = searchResult.reduce(
    (best, ytmSong) => {
      const lengthDiff = spotifyTrack.length - ytmSong.duration * 1000;
      let score = 1.0 - Math.abs(lengthDiff / spotifyTrack.length);
      if (spotifyTrack.title === ytmSong.name) score *= 2;
      if (spotifyTrack.artist === ytmSong.artist.name) score *= 2;

      if (best.score < score) return { score, ytmSong };
      return best;
    },
    { score: -1 }
  );
  if (!bestMatch) return;

  spotifyTrack.videoId = bestMatch.videoId;
  spotifyTrack.length = bestMatch.duration * 1000;

  return spotifyTrack;
}

async function resolveSpotifyTrack(id) {
  const uri = `spotify:track:${id}`;
  const previouslyResolved = spotifyResolveDb.get(uri);
  if (previouslyResolved)
    return resolveYouTubeVideo(previouslyResolved.youtubeId);

  const track = await sp.getTrack(id);
  const spotifyTrack = {
    videoId: undefined,
    url: makeProperSpotifyUrl(uri),
    title: track.data.trackUnion.name,
    artist: track.data.trackUnion.artistsWithRoles.items
      .map((i) => i.artist.profile.name)
      .join(", "),
    length: track.data.trackUnion.duration.totalMilliseconds,
    thumbnail: track.data.trackUnion.albumOfTrack.coverArt.sources[0].url,
  };

  const info = await resolveSpotifyTrackData(spotifyTrack);
  spotifyResolveDb.put(uri, info.videoId);

  return info;
}

async function resolveSpotifyAlbum(id) {
  const album = await sp.getAlbum(id);
  const spotifyAlbumTracks = await Promise.all(
    album.data.albumUnion.tracks.items.map(async ({ track }) => {
      const previouslyResolved = spotifyResolveDb.get(track.uri);
      if (previouslyResolved)
        return await resolveYouTubeVideo(previouslyResolved.youtubeId);

      return {
        videoId: undefined,
        url: makeProperSpotifyUrl(track.uri),
        title: track.name,
        artist: track.artists.items.map((i) => i.profile.name).join(", "),
        length: track.duration.totalMilliseconds,
        thumbnail: album.data.albumUnion.coverArt.sources[0].url,
      };
    })
  );
  if (spotifyAlbumTracks.every((t) => t.videoId)) return spotifyAlbumTracks;

  const spotifyAlbum = {
    title: album.data.albumUnion.name,
    artist: album.data.albumUnion.artists.items
      .map((i) => i.profile.name)
      .join(", "),
    tracks: spotifyAlbumTracks,
  };

  const searchResult = await ytmusic.searchAlbums(
    `${spotifyAlbum.title} - ${spotifyAlbum.artist}`
  );
  const { ytmAlbum: bestMatch } = await searchResult.reduce(
    async (bestPromise, ytmAlbum) => {
      const best = await bestPromise;
      if (
        spotifyAlbum.title !== ytmAlbum.name &&
        spotifyAlbum.artist !== ytmAlbum.artist.name
      )
        return best;

      const ytmAlbumFull = await ytmusic.getAlbum(ytmAlbum.albumId);
      if (ytmAlbumFull.songs.length !== spotifyAlbum.tracks.length) return best;

      const score = ytmAlbumFull.songs.reduce((total, ytmSong, i) => {
        const spotifyTrack = spotifyAlbum.tracks[i];
        if (spotifyTrack.title === ytmSong.name) return total + 1;
        return total;
      }, 0);

      if (best.score < score) return { score, ytmAlbum: ytmAlbumFull };
      return best;
    },
    Promise.resolve({ score: -1 })
  );
  if (!bestMatch) return;

  const items = bestMatch.songs.map((ytmSong, i) => {
    const spotifyTrack = spotifyAlbum.tracks[i];
    if (spotifyTrack.videoId) return spotifyTrack;

    spotifyTrack.videoId = ytmSong.videoId;
    const uri = album.data.albumUnion.tracks.items[i].track.uri;
    spotifyResolveDb.put(uri, ytmSong.videoId);

    return spotifyTrack;
  });

  return items;
}

async function resolveSpotifyPlaylist(id) {
  const playlist = await sp.getPlaylist(id);
  const properUrl = makeProperSpotifyUrl(`spotify:playlist:${id}`);

  const items = await Promise.all(
    playlist.data.playlistV2.content.items.map(async ({ item }) => {
      const previouslyResolved = spotifyResolveDb.get(item.data.uri);
      if (previouslyResolved)
        return resolveYouTubeVideo(previouslyResolved.youtubeId);

      const trackInfo = {
        videoId: undefined,
        url: properUrl,
        title: item.data.name,
        artist: item.data.artists.items.map((i) => i.profile.name).join(", "),
        length: item.data.trackDuration.totalMilliseconds,
        thumbnail: item.data.albumOfTrack.coverArt.sources[0].url,
      };

      const info = await resolveSpotifyTrackData(trackInfo);
      spotifyResolveDb.put(item.data.uri, info.videoId);

      return info;
    })
  );

  return items;
}
