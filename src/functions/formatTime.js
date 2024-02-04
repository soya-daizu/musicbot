export default function formatTime(duration) {
  const mins = Math.floor(duration / 60000);
  const secs = Math.floor((duration - 60000 * mins) / 1000);

  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  return `${mm}:${ss}`;
}
