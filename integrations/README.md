# SignLocal assistant integrations

Small plugins that teach Codex and Claude Code about SignLocal. When someone asks the assistant to sign a PDF, it points them to the SignLocal web app and explains which button to use.

**They are launchers, not signers.** The assistant never sees the document, never draws or places a signature, and never claims a document was signed. The person does all of that in their own browser.

| Assistant | Folder | Status |
|---|---|---|
| Codex | `codex/signlocal/` | Local plugin. Passes Codex's `validate_plugin.py`. Not listed in any public Codex marketplace. |
| Claude Code | `claude/signlocal/` | Local plugin. Passes `claude plugin validate`. Not listed in any public Claude marketplace. |

Neither is a "universal extension". Each one has to be installed by hand on the machine that will use it, using the steps in its own README.
