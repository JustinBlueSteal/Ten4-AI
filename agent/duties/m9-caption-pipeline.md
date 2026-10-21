---
id: m9-caption-pipeline
title: Refine M9 real transcription and translation pipeline
schedule: manual
gate: backend,mobile
---
Ensure live audio transcriptions from Whisper are processed through the Gemini pipeline in backend/src/pipeline and rendered as closed captions in mobile/. Live captions must display both spoken 10-codes and plain-language meanings (spec.md section 3). Do not use mock data or fake models.
