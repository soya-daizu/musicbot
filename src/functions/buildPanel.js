import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";

import formatTime from "./formatTime.js";

export function fillFields(embed, session) {
  let nextItemStr = "なし";
  if (session.queueRepeat.enabled && session.queue.length) {
    if (session.queueRepeat.shuffle) nextItemStr = "シャッフル中";
    else {
      const nextItem =
        session.queue[(session.queueRepeat.index + 1) % session.queue.length];
      nextItemStr = nextItem.title;
    }
  } else if (session.queue.length) nextItemStr = session.queue[0].title;

  const queueLengthStr = formatTime(
    session.queue.reduce((total, info) => total + info.length, 0)
  );
  embed.setFields(
    { name: "次の曲", value: nextItemStr, inline: true },
    {
      name: "再生待ち",
      value: `${session.queue.length}曲(${queueLengthStr})`,
      inline: true,
    },
    {
      name: "音量",
      value: `${session.volume * 100}%`,
      inline: true,
    },
    {
      name: "ビットレート",
      value: `${session.bitrate / 1000}kbps`,
      inline: true,
    }
  );
}

export function fillCurrentVideo(embed, session, files) {
  const progress = session.player.state.resource.playbackDuration ?? 0;
  const { title, artist, url, thumbnail, length } = session.currentVideo;

  const playbackSymbol = session.paused ? "⏸" : "▶";
  const progressBar = "="
    .repeat(Math.round((progress / length) * 20))
    .padEnd(20, "-");

  const progressStr = formatTime(progress);
  const lengthStr = formatTime(length);
  embed.setDescription(
    `## [${title} - ${artist}](${url})
${playbackSymbol}\`[${progressBar}](${progressStr}/${lengthStr})\``
  );

  if (thumbnail?.startsWith("http")) embed.setThumbnail(thumbnail);
  else if (thumbnail) {
    if (files)
      files.push(new AttachmentBuilder(thumbnail, { name: "thumbnail.png" }));
    embed.setThumbnail("attachment://thumbnail.png");
  }
}

export function buildButtons1(session) {
  return new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setCustomId("startOverButton")
      .setLabel("始めから")
      .setEmoji("⏪")
      .setDisabled(!session?.currentVideo)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("toggleButton")
      .setLabel(session?.paused ? "再開" : "一時停止")
      .setEmoji(session?.paused ? "▶️" : "⏸️")
      .setDisabled(!session?.currentVideo)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("skipButton")
      .setLabel("進む")
      .setEmoji("⏭️")
      .setDisabled(!session?.currentVideo)
      .setStyle(ButtonStyle.Primary)
  );
}

export function buildButtons2(session) {
  const row = new ActionRowBuilder();
  if (!session?.queueRepeat.enabled)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("repeatButton")
        .setLabel("リピート")
        .setEmoji("🔂")
        .setDisabled(!session?.currentVideo)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("shuffleButton")
        .setLabel("シャッフル")
        .setEmoji("🔀")
        .setDisabled(!session?.currentVideo)
        .setStyle(ButtonStyle.Primary)
    );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("repeatQueueButton")
      .setLabel(
        `全体リピート${session?.queueRepeat.enabled ? "無効化" : "有効化"}`
      )
      .setEmoji("🔁")
      .setDisabled(!session?.currentVideo)
      .setStyle(
        session?.queueRepeat.enabled
          ? ButtonStyle.Secondary
          : ButtonStyle.Primary
      )
  );

  if (session?.queueRepeat.enabled)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("shuffleButton")
        .setLabel(
          `シャッフル${session?.queueRepeat.shuffle ? "無効化" : "有効化"}`
        )
        .setEmoji("🔀")
        .setDisabled(!session?.currentVideo)
        .setStyle(
          session?.queueRepeat.shuffle
            ? ButtonStyle.Secondary
            : ButtonStyle.Primary
        )
    );
  return row;
}

export function buildButtons3(session) {
  return new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setCustomId("addButton")
      .setLabel("楽曲追加")
      .setEmoji("📥")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("clearButton")
      .setLabel("クリア")
      .setEmoji("❎")
      .setDisabled(!session?.queue.length)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("settingsButton")
      .setLabel("設定")
      .setEmoji("⚙️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("leaveButton")
      .setLabel("切断")
      .setEmoji("⚫")
      .setStyle(ButtonStyle.Danger)
  );
}

export default function buildPanel(session) {
  const embed = new EmbedBuilder().setTitle("🎵現在再生中");

  if (session) fillFields(embed, session);

  const files = [];
  if (session?.currentVideo?.length) {
    fillCurrentVideo(embed, session, files);
  } else if (session?.queue.length) {
    embed.setDescription("準備中");
  } else {
    embed.setDescription("なし");
  }

  return {
    embeds: [embed],
    files,
    components: [
      buildButtons1(session),
      buildButtons2(session),
      buildButtons3(session),
    ],
  };
}

export async function updatePanel(session, parts) {
  if (!parts || parts.length === 0) {
    session.panelMsg = await session.panelMsg.edit(buildPanel(session));
    return;
  }

  session.panelMsg = await session.panelMsg.fetch();
  const embed = new EmbedBuilder(session.panelMsg.embeds[0]);
  let components;
  for (const part of parts) {
    if (part === "currentVideo") fillCurrentVideo(embed, session);
    else if (part === "fields") fillFields(embed, session);
    else if (part === "buttons")
      components = [
        buildButtons1(session),
        buildButtons2(session),
        buildButtons3(session),
      ];
  }
  session.panelMsg = await session.panelMsg.edit({
    embeds: [embed],
    components,
  });
}
