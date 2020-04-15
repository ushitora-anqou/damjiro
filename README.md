# Damjiro

[![Build Status](https://travis-ci.org/ushitora-anqou/damjiro.svg?branch=master)](https://travis-ci.org/ushitora-anqou/damjiro)

Yet another _karaoke_ system w/ scoring.

## How to play

- Decide a song you want to sing.
- Get its MIDI file including melody and find its karaoke-like YouTube video somehow.
- Go to [https://ushitora-anqou.github.io/damjiro/](https://ushitora-anqou.github.io/damjiro/).
- Click "open" at the middle of the page and select your MIDI file.
- Change "Track No." and "Channel No." to select melody.
- Set "YouTube video id", which is the last part of the url of your YouTube video (XXXXX of `youtube.com/watch?v=XXXXX`).
- Set "intro time (sec)", which is the number of seconds of the song's introduction.
- Set "pitch offset (SMF note#)" if the key is too high or low.
- JSON text will be shown in the textarea. Copy it to another textarea above.
- Play the video and sing it.

## Development
- install yarn@1.22.4
- Run `yarn install`
- Run `yarn start`

## License

This project is licensed under MIT License.
However, the following files are not our works:

- `public/GeneralUserGSv1.471.sf2` is not our work, but [S. Christian Collins's](http://www.schristiancollins.com/generaluser.php).
- `public/libtimidity.wasm` is not our work. It was built from [sezero/libtimidity](https://github.com/sezero/libtimidity) by using [feross/timidity's](https://github.com/feross/timidity) tools.
- `public/models/*` are not our work, but [ML5.js's](https://ml5js.org/)

See the file `LICENSE` for details.
