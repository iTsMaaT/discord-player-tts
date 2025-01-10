import { BaseExtractor, SearchQueryType, ExtractorSearchContext, ExtractorInfo, Track } from 'discord-player';
import { Readable } from 'stream';

interface TTSExtractorOptions {
    language: string;
    slow: boolean;
}
declare class TTSExtractor extends BaseExtractor<TTSExtractorOptions> {
    static identifier: string;
    static instance: TTSExtractor | null;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    validate(query: string, type: SearchQueryType & "tts"): Promise<boolean>;
    handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo>;
    stream(track: Track): Promise<Readable>;
    getRelatedTracks(): Promise<ExtractorInfo>;
    private getCombinedAudioBuffer;
}

export { TTSExtractor, type TTSExtractorOptions };
