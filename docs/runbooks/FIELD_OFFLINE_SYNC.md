# Field Offline Sync

- Jobs cached in `localStorage` key `servesa.field.jobs`.
- Draft notes in `servesa.field.draftNote`.
- Start work / propose completion require online + server confirm.
- On failure, surface error; do not mark completed locally.
- Clear drafts after successful propose.
