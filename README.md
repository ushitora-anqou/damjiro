# Damjiro

[![Build Status](https://travis-ci.org/ushitora-anqou/damjiro.svg?branch=master)](https://travis-ci.org/ushitora-anqou/damjiro)

Yet another _karaoke_ system w/ scoring.

## How to play

- Decide a song you want to sing.
- Get its MIDI file including melody and find its karaoke-like YouTube video somehow.
- Go to [https://ushitora-anqou.github.io/damjiro/](https://ushitora-anqou.github.io/damjiro/).
- Click "open" at the middle of the page and select your MIDI file.
- Change "Track No." and "Channel No." to select melody.
- Set "YouTube video id", which is the last part (XXXXX of `youtube.com/watch?v=XXXXX`) of the url of your YouTube video.
- Set "intro time (sec)", which is the number of seconds of the song's introduction.
- Set "pitch offset (SMF note#)" if the key is too high or low.
- JSON text will be shown in the textarea. Copy it to another textarea above.
- Play the video and sing it.

## License

- `public/models/*` are not my work, but [ML5.js's](https://ml5js.org/)
```
MIT License

Copyright (c) 2018 ML5.js

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
- Others (of course except dependencies) are mime and can be used under MIT License. See the file `LICENSE` for details.
