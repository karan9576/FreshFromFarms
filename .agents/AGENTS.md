# FreshFromFarms Workspace Customization Rules

## 1. Documentation Rule
- **Maintain Master Summary Report**: Whenever a new feature, component, API endpoint, database schema, or infrastructure configuration is added, modified, or removed in the codebase, the master documentation file [PROJECT_SUMMARY_REPORT.txt](file:///d:/FreshFromFarm/PROJECT_SUMMARY_REPORT.txt) MUST be updated immediately to reflect the change.
- **Master Feature Inventory**: Keep Section 8 (Master Feature Inventory Checklist) in `PROJECT_SUMMARY_REPORT.txt` synchronized with all implemented capabilities.

## 2. Release & Branching Strategy Rule
- **Dual-Branch Pipeline**: All feature development must take place on the `dev` branch.
- **Staging Preview Deployment**: Pushing to the `dev` branch deploys preview changes directly to `https://fresh-from-farms-red.vercel.app`.
- **Production Merge**: Upon user approval, merge changes into `main` to trigger automated production deployment to `https://www.freshfromfarms.shop` (and `https://freshfromfarms.shop`).

## 3. Dual-Agent Feature Workflow Rule
- **Implementation Agent**: Whenever a new feature or change is requested, one agent executes the codebase changes on the `dev` branch.
- **Verification & Testing Agent (Desktop & Mobile)**: A dedicated agent independently tests and verifies the changes across BOTH Desktop (1920x1080) and Mobile (375x812) viewports to confirm UI layout responsiveness, visual excellence, and functionality before completion.

