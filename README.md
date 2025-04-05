# Text-to-Speech Extractor

This is a custom extractor for [discord-player](https://github.com/Androz2091/discord-player) that allows you to use Google's Text-to-Speech API to convert text into audio.

## Installation

```bash
npm install tts-extractor
```

## Usage

```js
const { Player } = require("discord-player");

const { TTSExtractor } = require("tts-extractor");
// Or
import { TTSExtractor } from "tts-extractor";

const player = new Player(client, {});

await player.extractors.register(TTSExtractor, { /* options */ });
```

To call it, you will need to use the `tts` protocol in your search query.

For example:

```js
const query = "Never gonna give you up";

player.play(voiceChannel, `tts:${query}`);
```

## Supported features

| Feature | Supported |
| --- | --- |
| Single tracks | ❌* |
| Playlists | ❌ |
| Search | ❌ |
| Direct streaming | ✅ |
| Can be used as a bridge | ❌ |
| Can bridge to ... | ❌ |
| Autoplay | ❌ |

\* Only works with raw queries.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| language | string | "en" | The language to use for the TTS query. |
| slow | boolean | false | Whether to use slower TTS speed. |