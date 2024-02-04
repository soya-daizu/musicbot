export default function truncateLines(lines, maxChars) {
  let charCount = 0,
    dispMaxLines = 0;
  for (const line of lines) {
    // 正確な文字列長ではないが大まかに分かれば問題ない
    charCount += line.length + 1;
    if (charCount > maxChars) break;
    dispMaxLines += 1;
  }

  if (dispMaxLines < lines.length) {
    return lines.slice(0, dispMaxLines - 1);
  } else {
    return lines;
  }
}
