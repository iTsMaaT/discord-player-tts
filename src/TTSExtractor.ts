import { 
    BaseExtractor,
    ExtractorInfo,
    ExtractorSearchContext,
    QueryType,
    SearchQueryType,
    Track,
    Util,
    Player,
    RawTrackData,
} from "discord-player";
import { HTMLElement, parse } from "node-html-parser";
import { createReadStream, existsSync } from "fs";
import type { IncomingMessage } from "http";
import https from "https";
import http from "http";
import { Readable } from "stream";
import { getAllAudioBase64 } from "./google-tts-api/getAudioBase64";

export interface TTSExtractorOptions {
    language: string;
    slow: boolean;
}

export class TTSExtractor extends BaseExtractor<TTSExtractorOptions> {
    public static identifier = "com.itsmaat.discord-player.tts-extractor";
    public static instance: TTSExtractor | null = null;

    async activate(): Promise<void> {
        this.protocols = ["tts"];
        TTSExtractor.instance = this;
    }

    async deactivate(): Promise<void> {
        this.protocols = [];
        TTSExtractor.instance = null;
    }

    async validate(query: string, type: SearchQueryType & "tts"): Promise<boolean> {
        return typeof query === "string" && type === "tts";
    }    

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        if (!context.protocol || context.protocol !== "tts") throw new Error("Invalid extractor invocation, skipping...");
        const trackInfo = {
            title: "TTS Query",
            author: "google-tts-api",
            duration: 0,
            thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png",
            description: query,
            requestedBy: null,
            raw: { query: query },
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
            query: query,
            // @ts-expect-error queryType is not in the type definition
            queryType: "tts", 
            raw: trackInfo.raw,
            async requestMetadata() {
                return trackInfo;
            },
        });
        
        track.extractor = this;
        
        return this.createResponse(null, [track]);
    }

    async stream(track: Track): Promise<Readable> {
        const raw = track.raw as unknown as { query: string };
        const audioBuffer = await this.getCombinedAudioBuffer(raw.query);
        const audioStream = Readable.from(audioBuffer);

        return audioStream;
    }

    async getRelatedTracks(): Promise<ExtractorInfo> {
        return this.createResponse(null, []);
    }

    private async getCombinedAudioBuffer(inputText: string): Promise<Buffer> {
        const splitLongWords = (textInput: string) => {
            const maxWordLength = 200;
            return textInput.split(/\s+/).flatMap(word => {
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
            splitPunct: ",.?!;:",
        });
    
        const audioBuffers = audioBase64Parts.map(part => Buffer.from(part.base64, "base64"));
        return Buffer.concat(audioBuffers);
    }
}