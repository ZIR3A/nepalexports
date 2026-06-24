# Full-Stack Role-Based Access Control (RBAC)

The ExportHub platform utilizes a unified Full-Stack RBAC architecture. Roles dictate exactly what a user can see on the frontend, which pages they can load, and which API operations they can execute on the backend.

## Roles Overview

The system supports four distinct administrative roles, formatted in `snake_case`. Below is a breakdown of what each role can access.

### 1. `super_admin`
The Super Admin is the highest privilege level and has unrestricted access across the entire platform.
- **Frontend Access:** Full visibility of the Admin Sidebar.
- **Backend Access:** Can execute all API endpoints.
- **Exclusive Features:** The only role with access to **Finance**, **Analytics**, and advanced **WMS Sync Simulations**.

### 2. `admin`
The Admin manages day-to-day operations and team oversight.
- **Frontend Access:** Dashboard, Orders, Products, Categories, Customers, Inventory, Warehouses, Transfers, Activity Logs, Alerts, and Settings.
- **Backend Access:** Has CRUD capabilities across Products, Users, Categories, and Inventory.
- **Restrictions:** Cannot access Finance or Analytics. Cannot trigger the advanced WMS synchronization simulations.

### 3. `marketing_admin`
The Marketing Admin is responsible for the digital storefront catalog and customer engagement.
- **Frontend Access:** Dashboard, Orders, Products, Categories, Customers, Alerts, and Settings.
- **Backend Access:** Can Create, Update, and Delete Products/Categories via the `/api/products` endpoints. 
- **Restrictions:** Cannot view or adjust physical warehouse stock numbers (`/api/wms/internal/inventory`). Cannot view system Activity Logs or Finance.

### 4. `warehouse_manager`
The Warehouse Manager is dedicated strictly to inventory health and logistics.
- **Frontend Access:** Inventory, Warehouses, Transfers, Alerts, and Settings.
- **Backend Access:** Can perform inventory adjustments and stock transfers (`/api/wms/internal/inventory` & `transfers`).
- **Restrictions:** Completely blocked from accessing the Main Dashboard, Product CRUD operations, Customers, Orders, Activity Logs, and Finance.

---

## Technical Architecture

The RBAC implementation spans three layers to ensure bulletproof security.

### 1. Backend: API Route Middleware
Backend routes are protected using the centralized `authorizeRoles` utility located at `src/backend/middleware/auth.js`. This function reads the NextAuth session token and immediately rejects unauthorized requests.

**Example Usage:**
```javascript
import { authorizeRoles } from '@/backend/middleware/auth';

export async function POST(req) {
  // Only super_admin and marketing_admin can create products
  const authResponse = await authorizeRoles('super_admin', 'marketing_admin');
  if (authResponse) return authResponse; // Returns 403 Forbidden Response if unauthorized

  // ... proceed with logic
}
```

### 2. Frontend: Hard Route Guards (`<RoleGuard>`)
We use a Higher-Order Component approach to protect entire page routes from unauthorized access. The `<RoleGuard>` wraps page components or layout files. If an unauthorized user manually navigates to a forbidden URL, they are immediately redirected back to the `/admin` dashboard.

**Example Usage:**
```jsx
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function AdminProducts() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'marketing_admin']}>
      <div>... Product UI ...</div>
    </RoleGuard>
  );
}
```

### 3. Frontend: Conditional Element Rendering (`<RequireRole>`)
For granular control over specific buttons or sections within an authorized page, we use the `<RequireRole>` wrapper. This silently hides UI elements from users who lack the required privileges, preventing "Unauthorized" flash errors.

**Example Usage:**
```jsx
import { RequireRole } from "@/components/providers/RequireRole";

<RequireRole allowedRoles={['super_admin']}>
  <Button onClick={simulateWmsSync}>
    Simulate WMS Sync
  </Button>
</RequireRole>
```

### 4. Dynamic Sidebar Navigation
The `AdminSidebar` component does not rely on hardcoded views. It maps over a configuration array and dynamically filters the navigation sections based on the `session.user.role`. This ensures users only see the navigation links they are authorized to interact with.
