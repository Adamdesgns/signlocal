# SignLocal plugin for Codex

Installs through your personal Codex marketplace.

1. Copy the `signlocal` folder in this directory to `~/plugins/signlocal`
   (on Windows: `C:\Users\<you>\plugins\signlocal`).
2. Add this entry to the `plugins` array in `~/.agents/plugins/marketplace.json`.
   If the file does not exist yet, create it with `"name": "personal"`,
   `"interface": { "displayName": "Personal" }`, and a `plugins` array.

   ```json
   {
     "name": "signlocal",
     "source": { "source": "local", "path": "./plugins/signlocal" },
     "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
     "category": "Productivity"
   }
   ```
3. Install it:

   ```bash
   codex plugin add signlocal@personal
   ```
4. Start a new Codex thread and ask: "Help me sign a PDF privately."

To check the plugin after editing it, run Codex's own validator:

```bash
python ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py ./signlocal
```

(The validator needs PyYAML: `pip install pyyaml`.)
