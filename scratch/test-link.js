const text = '<u>:<u>https://us06web.zoom.us/j/81679915326?pwd=</u>';
const urlRegex = /(https?:\/\/[^\s<]+)/g;

const parts = text.split(urlRegex);
console.log('Parts:', parts);

const rendered = parts.map((part, i) => {
  if (part.match(urlRegex)) {
    return `<a href="${part}">${part}</a>`;
  }
  return part;
}).join('');

console.log('Rendered:', rendered);
