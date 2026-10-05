// Empty stand-in for json-url's Node-only codec dependencies (lzma, node-lzw, msgpack5), as in
// the Webforms app. The json-url engine references every codec loader, so the bundler would emit
// all of them; the share links only ever use the stream + lz-string codecs (see signShare.js), so
// these are never loaded at runtime. vite.config.js aliases them here to keep them out of the
// build. (Node, and so the tests, still resolve the real packages.)
export default {}
