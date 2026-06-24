# Global Activity Tracking & RBAC Hierarchy

This document outlines the business logic and technical workflow for the Global Activity Tracking (Audit Trail) system and the expanded Role-Based Access Control (RBAC) hierarchy. This is designed for non-technical stakeholders to understand how user actions are monitored and how access is restricted across the ExportHub platform.

## 1. Role-Based Access Control (RBAC) Expansion

To ensure secure operations and proper separation of duties, the system enforces strict role-based permissions. A new **Admin** role has been introduced.

### The Roles and Their Access
- **Super Admin**: Has unrestricted master access to the entire platform. This includes creating/deleting products, managing all inventory, viewing high-level financial analytics, and full access to the Activity Logs.
- **Admin**: Has broad operational management capabilities similar to a Super Admin, including the ability to view the Activity Logs to monitor system health and user actions.
- **Warehouse Manager**: Restricted entirely to physical supply chain tools (Inventory, Transfers, Warehouses). They **cannot** access financial data or the Activity Logs.
- **Marketing Admin**: Restricted to managing the storefront, creating drafts, and publishing products. They **cannot** access the Activity Logs or the physical warehouse operations.

*Business Impact*: By introducing the "Admin" role, you can delegate operational oversight without giving away full "Super Admin" keys to the kingdom. Restricting the Activity Logs ensures that standard employees cannot monitor the activities of executives or other departments.

## 2. Global Activity Tracking (Audit Trail)

When multiple teams (Warehouse, Marketing, Admin) are working in a single unified system, it is critical to know exactly **who** did **what**, and **when**.

### The Workflow
1. **The Interception**: Whenever any user attempts to modify data in the system (e.g., adding stock, deleting a product, dispatching a transfer), they hit a "Save" or "Submit" button.
2. **The Middleware**: Before the system actually processes that save, a background engine (the `activityTracker` middleware) intercepts the request. 
3. **The Execution**: The system allows the action to complete normally. If the action succeeds (e.g., the cargo is successfully received), the middleware immediately kicks in again.
4. **The Log**: The middleware captures the user's ID, their Name, what exact action they performed (e.g., `update_transfer_milestone`), the specific target of that action (e.g., the specific Transfer ID), and a raw snapshot of the data that was submitted. This is permanently saved to an `ActivityLogs` database collection.

*Business Impact*: If inventory suddenly goes missing, or a product is accidentally deleted from the storefront, Super Admins can immediately consult the Activity Logs to trace the exact user responsible, preventing internal disputes and increasing accountability.

## 3. The Dashboard UI

To make this data easily accessible, a new **Activity Logs** dashboard has been added to the System sidebar.

- **Visibility**: Automatically hidden from everyone except Super Admins and Admins.
- **Features**: Displays a chronological list of every major system modification.
- **Filtering**: Admins can search for specific employee names to audit a single person's work, or filter by specific actions (e.g., "Show me every time a transfer was updated").
- **Deep Dive**: Clicking the eye icon on any log opens a detailed view showing the raw technical data of the transaction for deeper forensic investigation.
