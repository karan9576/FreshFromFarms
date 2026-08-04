# FreshFromFarms Workspace Customization Rules

## 1. Documentation Rule
- **Maintain Master Summary Report**: Whenever a new feature, component, API endpoint, database schema, or infrastructure configuration is added, modified, or removed in the codebase, the master documentation file [PROJECT_SUMMARY_REPORT.txt](file:///d:/FreshFromFarm/PROJECT_SUMMARY_REPORT.txt) MUST be updated immediately to reflect the change.
- **Master Feature Inventory**: Keep Section 8 (Master Feature Inventory Checklist) in `PROJECT_SUMMARY_REPORT.txt` synchronized with all implemented capabilities.

## 2. Release & Branching Strategy Rule
- **Dual-Branch Pipeline**: All feature development must take place on the `dev` branch.
- **Production Merge**: Upon user approval, merge changes into `main` to trigger automated Vercel and Render production deployments.
