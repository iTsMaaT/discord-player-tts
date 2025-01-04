// src/TTSExtractor.ts
import {
  BaseExtractor,
  Track,
  Util
} from "discord-player";
import { getAllAudioBase64 } from "google-tts-api";
import { Readable } from "stream";
var TTSExtractor = class extends BaseExtractor {
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
    const track = new Track(this.context.player, {
      title: trackInfo.title,
      duration: Util.buildTimeCode(Util.parseMS(trackInfo.duration)),
      description: trackInfo.description,
      thumbnail: trackInfo.thumbnail,
      views: 0,
      author: trackInfo.author,
      requestedBy: context.requestedBy,
      source: "arbitrary",
      metadata: trackInfo,
      // @ts-expect-error queryType is not in the type definition
      queryType: "tts",
      async requestMetadata() {
        return trackInfo;
      }
    });
    track.extractor = this;
    return this.createResponse(null, [track]);
  }
  async stream(track) {
    const audioBuffer = await this.getCombinedAudioBuffer(track.description);
    const audioStream = Readable.from(audioBuffer);
    return audioStream;
  }
  async getRelatedTracks() {
    return this.createResponse(null, []);
  }
  async getCombinedAudioBuffer(inputText) {
    const audioBase64Parts = await getAllAudioBase64(inputText, {
      lang: "fr",
      slow: false,
      splitPunct: ",.?"
    });
    const audioBuffers = audioBase64Parts.map((part) => Buffer.from(part.base64, "base64"));
    return Buffer.concat(audioBuffers);
  }
};
TTSExtractor.identifier = "com.itsmaat.discord-player.tts-extractor";
export {
  TTSExtractor
};
