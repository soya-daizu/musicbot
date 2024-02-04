import { getMusicSession } from "../voiceConnections.js";

export default function handleVoiceStateUpdate(oldState, newState) {
  if (oldState.member.user.bot) return;
  // const voiceConnected =
  //   newState.channelId && oldState.channelId !== newState.channelId;
  const voiceDisconnected =
    oldState.channelId && oldState.channelId !== newState.channelId;

  if (voiceDisconnected) handleVoiceDisconnect(oldState);
}

function handleVoiceDisconnect(oldState) {
  const session = getMusicSession(oldState.guild.id);
  if (
    session &&
    oldState.channelId === session.channelId &&
    oldState.channel.members.size <= 1
  )
    handleMusicVoiceDisconnect(session);
}

function handleMusicVoiceDisconnect(session) {
  session.connection.destroy();
  session.panelMsg.channel.send({
    content: ":u7a7a: VCの参加者がいなくなったため、自動でVCを切断しました",
  });
}
