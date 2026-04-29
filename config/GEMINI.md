# Council Workflow (Global)

For every major feature or fix, you MUST follow this sequence:

1. **Plan**: Define scope and tests in `docs/PLAN.md` (or similar).
2. **Implement**: Perform the changes.
3. **External Review**: Run the `/council:review` command to get feedback from Kilo AI.
4. **Fix & Harden**: Apply high/medium priority fixes from the review.
5. **Final Verification**: Run tests and summarize.

Never skip the review phase. If no changes are staged, `/council:review` will notify you.
