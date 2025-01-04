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

await player.extractors.register(TTSExtractor, { /* no options yet */ });
```

To call it, you will need to use the `tts` protocol in your search query.

For example:

```js
const query = "Never gonna give you up";

player.play(voiceChannel, `tts:${query}`);
```