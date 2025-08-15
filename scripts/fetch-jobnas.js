import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseStringPromise } from "xml2js";
import slugify from "slugify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEED_URL = process.env.FEED_URL || "https://jobnas.com/feed";
const MAX_POSTS = Number(process.env.MAX_POSTS || 20);

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src", "posts");
const INDEX_FILE = path.join(ROOT, "posts_index.json");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) return { seen: {} };
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
}

function saveIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "netlify-jobnas-bot" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return await res.text();
}

function toDateISO(str) {
  const d = new Date(str || Date.now());
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

function sanitizeSlug(str) {
  return slugify(str, { lower: true, strict: true, locale: "id" }).slice(0, 80);
}

function buildFrontMatter({ title, date, tags = [], source, guid, link }) {
  const tagLine = tags.length ? `\ntags: [${tags.map(t => `'${t}'`).join(", ")}]` : "";
  return `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: ${date}${tagLine}\nsource: ${source}\nguid: ${guid}\nlink: ${link}\n---\n`;
}

async function parseRss(xml) {
  const js = await parseStringPromise(xml, { explicitArray: false, trim: true });
  if (js.rss?.channel?.item) {
    const items = Array.isArray(js.rss.channel.item) ? js.rss.channel.item : [js.rss.channel.item];
    return items.map(it => ({
      title: it.title || "",
      link: it.link || "",
      date: it.pubDate || "",
      guid: it.guid?._ || it.guid || "",
      content: it["content:encoded"] || it.description || "",
      categories: Array.isArray(it.category) ? it.category : [it.category].filter(Boolean)
    }));
  }
  throw new Error("Unsupported feed format");
}

function pickNew(items, index) {
  return items.filter(it => {
    const key = it.guid || it.link || it.title;
    if (!key || index.seen[key]) return false;
    index.seen[key] = true;
    return true;
  });
}

function writeMarkdown(item) {
  const dateIso = toDateISO(item.date);
  const slug = sanitizeSlug(item.title) || sanitizeSlug(item.guid || "post");
  const fm = buildFrontMatter({
    title: item.title,
    date: dateIso,
    tags: item.categories || [],
    source: "jobnas.com",
    guid: item.guid || "",
    link: item.link || ""
  });
  const filePath = path.join(POSTS_DIR, `${dateIso.slice(0, 10)}-${slug}.md`);
  fs.writeFileSync(filePath, fm + "\n" + item.content);
}

async function main() {
  ensureDir(POSTS_DIR);
  const index = loadIndex();
  const xml = await fetchText(FEED_URL);
  const items = await parseRss(xml);
  const fresh = pickNew(items.slice(0, MAX_POSTS), index);
  fresh.forEach(writeMarkdown);
  saveIndex(index);
  console.log(`Fetched ${fresh.length} new posts`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
