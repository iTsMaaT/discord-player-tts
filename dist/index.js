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
    return typeof query === "string" && type === "tts";
  }
  async handle(query, context) {
    const trackInfo = {
      title: "TTS Query",
      author: "google-tts-api",
      duration: 0,
      thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png",
      description: query,
      requestedBy: null,
      raw: { query }
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
    const audioStream = Readable.from(audioBuffer);
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
      lang: "fr",
      slow: false,
      splitPunct: ",.?!;:"
    });
    const audioBuffers = audioBase64Parts.map((part) => Buffer.from(part.base64, "base64"));
    return Buffer.concat(audioBuffers);
  }
};
TTSExtractor.identifier = "com.itsmaat.discord-player.tts-extractor";
export {
  TTSExtractor
};
