"use strict";

// v18 temporarily delegates directly to the last known-good runtime.
// The previous v18 bootstrap rewrote v17 source code as strings and could
// generate invalid JavaScript (unescaped line breaks) before dynamic import.
// Loading v17 directly avoids that brittle second patching layer entirely.
import "./game-v17.js";
