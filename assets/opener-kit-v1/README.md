# Invitation opener kit v1

Open index.html to review all ten first/last frame pairs and their prompts.

Each template has mobile/ and web/ folders containing first.png (generated opening), last.png (extracted hero destination), and prompts.md (first-frame and video prompts). prompts.json contains the complete prompt set.

Generation: built-in image generation tool. No opening videos generated and no application code changed.

Mobile ending frames: native 540×960 first decoded frames from public/films/mobile/*-v1.mp4.
Web ending frames: 1920×1080 cover crops from first decoded frames of public/films/scroll/*-moving.mp4. Original desktop videos are 720×1280 portrait; hero-source-first.png preserves that source. Cropped output is upscaled, not new landscape detail. Center crop except After Hours, which matches its 38% vertical focal point. Exact handoff requires using the same viewport/crop; arbitrary desktop aspect ratios need corresponding cover crops.

Use each first.png and last.png as endpoint inputs with its video prompt. Endpoint adherence must be checked on generated video; a prompt alone cannot guarantee a seamless match. Match frame dimensions in the video tool. Hold the ending briefly and hand off at hero time zero.
