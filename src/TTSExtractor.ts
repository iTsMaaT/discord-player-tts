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
import { getAllAudioBase64 } from "google-tts-api";
import { Readable } from "stream";


export class TTSExtractor extends BaseExtractor {
    public static identifier = "com.itsmaat.discord-player.tts-extractor";

    async activate(): Promise<void> {
        this.protocols = ["tts"];
    }

    async deactivate(): Promise<void> {
        this.protocols = [];
    }

    async validate(query: string, type: SearchQueryType): Promise<boolean> {
        if (typeof query !== "string") return false;
        return type === "tts" as unknown as SearchQueryType;
    }

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        const trackInfo = {
            title: "TTS Query",
            author: "google-tts-api",
            duration: 0,
            thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png",
            description: query,
            requestedBy: null,
            raw: { query },
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

    
    async getCombinedAudioBuffer(inputText: string): Promise<Buffer> {
        const audioBase64Parts = await getAllAudioBase64(inputText, {
            lang: "fr",
            slow: false,
            splitPunct: ",.?",
        });
    
        const audioBuffers = audioBase64Parts.map(part => Buffer.from(part.base64, "base64"));
        return Buffer.concat(audioBuffers);
    }
    
}
