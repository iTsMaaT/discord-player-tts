import { BaseExtractor, SearchQueryType, ExtractorSearchContext, ExtractorInfo, Track } from 'discord-player';
import { Readable } from 'stream';

declare class TTSExtractor extends BaseExtractor {
    static identifier: string;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    validate(query: string, type: SearchQueryType): Promise<boolean>;
    handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo>;
    stream(track: Track): Promise<Readable>;
    getRelatedTracks(): Promise<ExtractorInfo>;
    getCombinedAudioBuffer(inputText: string): Promise<Buffer>;
}

export { TTSExtractor };
