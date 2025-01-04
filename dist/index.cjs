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
var src_exports = {};
__export(src_exports, {
  TTSExtractor: () => TTSExtractor
});
module.exports = __toCommonJS(src_exports);

// src/TTSExtractor.ts
var import_discord_player = require("discord-player");
var import_google_tts_api = require("google-tts-api");
var import_stream = require("stream");
var TTSExtractor = class extends import_discord_player.BaseExtractor {
  async activate() {
    this.protocols = ["tts"];
  }
  async deactivate() {
    this.protocols = [];
  }
  async validate(query, type) {
    if (typeof query !== "string") return false;
    return type === "tts";
  }
  async handle(query, context) {
    const trackInfo = {
      title: "TTS Query",
      author: "google-tts-api",
      duration: 0,
      thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png",
      description: query,
      requestedBy: null
    };
    const track = new import_discord_player.Track(this.context.player, {
      title: trackInfo.title,
      duration: import_discord_player.Util.buildTimeCode(import_discord_player.Util.parseMS(trackInfo.duration)),
      description: trackInfo.description,
      thumbnail: trackInfo.thumbnail,
      views: 0,
      author: trackInfo.author,
      requestedBy: context.requestedBy,
      source: "arbitrary",
      metadata: trackInfo,
      async requestMetadata() {
        return trackInfo;
      }
    });
    track.extractor = this;
    return this.createResponse(null, [track]);
  }
  async stream(track) {
    const audioBuffer = await this.getCombinedAudioBuffer(track.description);
    const audioStream = import_stream.Readable.from(audioBuffer);
    return audioStream;
  }
  async getRelatedTracks() {
    return this.createResponse(null, []);
  }
  async getCombinedAudioBuffer(inputText) {
    const audioBase64Parts = await (0, import_google_tts_api.getAllAudioBase64)(inputText, {
      lang: "fr",
      slow: false,
      splitPunct: ",.?"
    });
    const audioBuffers = audioBase64Parts.map((part) => Buffer.from(part.base64, "base64"));
    return Buffer.concat(audioBuffers);
  }
};
TTSExtractor.identifier = "com.itsmaat.discord-player.tts-extractor";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TTSExtractor
});
