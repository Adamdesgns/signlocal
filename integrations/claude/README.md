# SignLocal plugin for Claude Code

This directory is a small local marketplace containing one plugin. It works in Claude Code (terminal, desktop app, IDE extensions). It is not an extension for the claude.ai chat website.

1. Add this folder as a marketplace (use the full path to this `claude` directory):

   ```bash
   claude plugin marketplace add /path/to/signlocal/integrations/claude
   ```
2. Install the plugin:

   ```bash
   claude plugin install signlocal@signlocal-local
   ```
3. Start a new Claude Code session and ask: "Help me sign a PDF privately."

To check the plugin after editing it:

```bash
claude plugin validate ./signlocal
```

To remove it:

```bash
claude plugin uninstall signlocal@signlocal-local
```
