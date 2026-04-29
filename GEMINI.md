# Council Workflow (Global)

For every major feature or fix, follow this sequence:

1. **Plan**: Define scope and tests in `docs/PLAN.md`.
2. **Implement**: Perform the code changes.
3. **External Review**: Run the `/council:review` command. This writes to `docs/REVIEW_KILO.md`.
4. **Fix & Harden**: Run `/council:review-apply` to apply High/Medium fixes automatically.
5. **Final Verification**: Run tests and summarize.

Never skip the review phase. 

---
### Command Reference
- `/council:review`: Generates a technical review of staged changes using Kilo Gateway.
- `/council:review-apply`: Automates the application of High/Medium risk fixes from the review.
- `/council`: Convene a decision council for high-stakes trade-offs (via ECC skill).
