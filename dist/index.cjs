"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  TTSExtractor: () => TTSExtractor
});
module.exports = __toCommonJS(index_exports);

// src/TTSExtractor.ts
var import_discord_player = require("discord-player");
var import_stream = require("stream");

// src/google-tts-api/assertInputTypes.ts
var assertInputTypes = (text, lang, slow, host) => {
  if (typeof text !== "string" || text.length === 0)
    throw new TypeError("text should be a string");
  if (typeof lang !== "string" || lang.length === 0)
    throw new TypeError("lang should be a string");
  if (typeof slow !== "boolean")
    throw new TypeError("slow should be a boolean");
  if (typeof host !== "string" || host.length === 0)
    throw new TypeError("host should be a string");
};
var assertInputTypes_default = assertInputTypes;

// src/google-tts-api/splitLongText.ts
var SPACE_REGEX = "\\s\\uFEFF\\xA0";
var DEFAULT_PUNCTUATION_REGEX = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
var splitLongText = (text, { maxLength = 200, splitPunct = "" } = {}) => {
  const isSpaceOrPunct = (s, i) => {
    const regex = new RegExp("[" + SPACE_REGEX + DEFAULT_PUNCTUATION_REGEX + splitPunct + "]");
    return regex.test(s.charAt(i));
  };
  const lastIndexOfSpaceOrPunct = (s, left, right) => {
    for (let i = right; i >= left; i--)
      if (isSpaceOrPunct(s, i)) return i;
    return -1;
  };
  const result = [];
  const addResult = (text2, start2, end) => {
    result.push(text2.slice(start2, end + 1));
  };
  let start = 0;
  for (; ; ) {
    if (text.length - start <= maxLength) {
      addResult(text, start, text.length - 1);
      break;
    }
    let end = start + maxLength - 1;
    if (isSpaceOrPunct(text, end) || isSpaceOrPunct(text, end + 1)) {
      addResult(text, start, end);
      start = end + 1;
      continue;
    }
    end = lastIndexOfSpaceOrPunct(text, start, end);
    if (end === -1) {
      const str = text.slice(start, start + maxLength);
      throw new Error(
        `The word is too long to split into a short text:
${str} ...

Try the option "splitPunct" to split the text by punctuation.`
      );
    }
    addResult(text, start, end);
    start = end + 1;
  }
  return result;
};
var splitLongText_default = splitLongText;

// src/google-tts-api/getAudioBase64.ts
var getAudioBase64 = async (text, { lang = "en", slow = false, host = "https://translate.google.com", timeout = 1e4 } = {}) => {
  assertInputTypes_default(text, lang, slow, host);
  if (typeof timeout !== "number" || timeout <= 0)
    throw new TypeError("timeout should be a positive number");
  if (text.length > 200) {
    throw new RangeError(
      `text length (${text.length}) should be less than 200 characters. Try "getAllAudioBase64(text, [option])" for long text.`
    );
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const res = await fetch(`${host}/_/TranslateWebserverUi/data/batchexecute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `f.req=${encodeURIComponent(
      JSON.stringify([
        [["jQ1olc", JSON.stringify([text, lang, slow ? true : null, "null"]), null, "generic"]]
      ])
    )}`,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
  if (!res.ok)
    throw new Error(`Request failed with status ${res.status}`);
  const data = await res.text();
  let result;
  try {
    const parsedData = JSON.parse(data.slice(5));
    result = parsedData[0][2];
  } catch (e) {
    throw new Error(`parse response failed:
${data}`);
  }
  if (!result)
    throw new Error(`lang "${lang}" might not exist`);
  try {
    const parsedResult = JSON.parse(result);
    result = parsedResult[0];
  } catch (e) {
    throw new Error(`parse response failed:
${data}`);
  }
  return result;
};
var getAllAudioBase64 = async (text, {
  lang = "en",
  slow = false,
  host = "https://translate.google.com",
  splitPunct = "",
  timeout = 1e4
} = {}) => {
  assertInputTypes_default(text, lang, slow, host);
  if (typeof splitPunct !== "string")
    throw new TypeError("splitPunct should be a string");
  if (typeof timeout !== "number" || timeout <= 0)
    throw new TypeError("timeout should be a positive number");
  const shortTextList = splitLongText_default(text, { splitPunct });
  const base64List = await Promise.all(
    shortTextList.map((shortText) => getAudioBase64(shortText, { lang, slow, host, timeout }))
  );
  const result = [];
  for (let i = 0; i < shortTextList.length; i++) {
    const shortText = shortTextList[i];
    const base64 = base64List[i];
    result.push({ shortText, base64 });
  }
  return result;
};

// src/TTSExtractor.ts
var _TTSExtractor = class _TTSExtractor extends import_discord_player.BaseExtractor {
  async activate() {
    this.protocols = ["tts"];
    _TTSExtractor.instance = this;
  }
  async deactivate() {
    this.protocols = [];
    _TTSExtractor.instance = null;
  }
  async validate(query, type) {
    return typeof query === "string" && (type === "tts" || new URL(query).protocol === "tts:");
  }
  async handle(query, context) {
    if (!context.protocol || context.protocol !== "tts") {
      this.debug("Invalid protocol, skipping...");
      return this.createResponse(null, []);
    }
    const trackInfo = {
      title: "TTS Query",
      author: "google-tts-api",
      duration: 0,
      thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png",
      description: query,
      requestedBy: null,
      raw: { query, type: "tts" }
    };
    const track = new import_discord_player.Track(this.context.player, {
      title: trackInfo.title,
      duration: import_discord_player.Util.buildTimeCode(import_discord_player.Util.parseMS(trackInfo.duration)),
      url: `tts://${trackInfo.title}`,
      description: trackInfo.description,
      thumbnail: trackInfo.thumbnail,
      views: 0,
      author: trackInfo.author,
      requestedBy: context.requestedBy,
      source: "arbitrary",
      metadata: trackInfo,
      query,
      // @ts-expect-error queryType is not in the type definition
      queryType: "tts",
      raw: trackInfo.raw,
      async requestMetadata() {
        return trackInfo;
      }
    });
    track.extractor = this;
    return this.createResponse(null, [track]);
  }
  async stream(track) {
    const raw = track.raw;
    const audioBuffer = await this.getCombinedAudioBuffer(raw.query);
    const audioStream = import_stream.Readable.from(audioBuffer);
    return audioStream;
  }
  async getRelatedTracks() {
    return this.createResponse(null, []);
  }
  async getCombinedAudioBuffer(inputText) {
    const splitLongWords = (textInput) => {
      const maxWordLength = 200;
      return textInput.split(/\s+/).flatMap((word) => {
        if (word.length > maxWordLength) {
          const chunks = [];
          for (let i = 0; i < word.length; i += maxWordLength)
            chunks.push(word.slice(i, i + maxWordLength));
          return chunks;
        }
        return word;
      }).join(" ");
    };
    const sanitizedText = splitLongWords(inputText);
    const audioBase64Parts = await getAllAudioBase64(sanitizedText, {
      lang: this.options.language || "en",
      slow: this.options.slow ?? false,
      splitPunct: ",.?!;:"
    });
    const audioBuffers = audioBase64Parts.map((part) => Buffer.from(part.base64, "base64"));
    return Buffer.concat(audioBuffers);
  }
};
_TTSExtractor.identifier = "com.itsmaat.discord-player.tts-extractor";
_TTSExtractor.instance = null;
var TTSExtractor = _TTSExtractor;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TTSExtractor
});
