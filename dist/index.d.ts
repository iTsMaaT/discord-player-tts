import { BaseExtractor, SearchQueryType, ExtractorSearchContext, ExtractorInfo, Track } from 'discord-player';
import { Readable } from 'stream';

interface TTSExtractorOptions {
    language: string;
    slow: boolean;
}
declare class TTSExtractor extends BaseExtractor<TTSExtractorOptions> {
    static identifier: string;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    validate(query: string, type: SearchQueryType & "tts"): Promise<boolean>;
    handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo>;
    stream(track: Track): Promise<Readable>;
    getRelatedTracks(): Promise<ExtractorInfo>;
    getCombinedAudioBuffer(inputText: string): Promise<Buffer>;
}

export { TTSExtractor, type TTSExtractorOptions };
