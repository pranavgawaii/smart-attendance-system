# Coordinator Module Export

This folder is a copyable bundle of the coordinator feature set from the Smart Attendance System.

## Included Features

- Coordinator CRUD management
- Attendance letter generation with the professional CN-CRTP PDF layout
- Attendance letter preview/download flow
- Coordinator application form management
- Public coordinator application form page
- Form response review workflow

## Included Files

### Backend

- `coordinator/server/src/controllers/coordinators.controller.js`
- `coordinator/server/src/routes/coordinators.routes.js`
- `coordinator/server/src/routes/forms.routes.js`
- `coordinator/server/sql/coordinator-module.sql`

### Frontend

- `coordinator/client/src/pages/admin/Coordinators.jsx`
- `coordinator/client/src/pages/admin/CoordinatorAttendance.jsx`
- `coordinator/client/src/pages/admin/forms/CoordinatorFormsHome.jsx`
- `coordinator/client/src/pages/admin/forms/FormBuilder.jsx`
- `coordinator/client/src/pages/admin/forms/FormResponses.jsx`
- `coordinator/client/src/pages/public/PublicFormPage.jsx`

### Assets

- `coordinator/assets/MIT_ADTU.png`

## Recommended Copy Paths

To keep imports working with minimal edits, copy these files into the same relative paths in the target project:

```text
coordinator/client/src/pages/admin/Coordinators.jsx              -> client/src/pages/admin/Coordinators.jsx
coordinator/client/src/pages/admin/CoordinatorAttendance.jsx     -> client/src/pages/admin/CoordinatorAttendance.jsx
coordinator/client/src/pages/admin/forms/CoordinatorFormsHome.jsx -> client/src/pages/admin/forms/CoordinatorFormsHome.jsx
coordinator/client/src/pages/admin/forms/FormBuilder.jsx         -> client/src/pages/admin/forms/FormBuilder.jsx
coordinator/client/src/pages/admin/forms/FormResponses.jsx       -> client/src/pages/admin/forms/FormResponses.jsx
coordinator/client/src/pages/public/PublicFormPage.jsx           -> client/src/pages/public/PublicFormPage.jsx

coordinator/server/src/controllers/coordinators.controller.js    -> src/controllers/coordinators.controller.js
coordinator/server/src/routes/coordinators.routes.js             -> src/routes/coordinators.routes.js
coordinator/server/src/routes/forms.routes.js                    -> src/routes/forms.routes.js
```

## Required Host App Integration

### Backend route mount

Mount these in your Express app:

```js
const coordinatorsRoutes = require('./routes/coordinators.routes');
const formsRoutes = require('./routes/forms.routes');

apiRouter.use('/coordinators', coordinatorsRoutes);
apiRouter.use('/forms', formsRoutes);
```

### Frontend routes

Add routes equivalent to:

```jsx
<Route path="coordinators" element={<Coordinators />} />
<Route path="coordinators/attendance" element={<CoordinatorAttendance />} />
<Route path="coordinators/forms" element={<CoordinatorFormsHome />} />
<Route path="coordinators/forms/new" element={<FormBuilder />} />
<Route path="coordinators/forms/:id/edit" element={<FormBuilder />} />
<Route path="coordinators/forms/:id/responses" element={<FormResponses />} />
<Route path="/forms/:slug" element={<PublicFormPage />} />
```

### Role/menu integration

If your target project has role-based admin navigation, also mirror these behaviors:

- `coordinator_admin` can enter the coordinator area
- login redirect for `coordinator_admin` should point to `/admin/coordinators`
- admin sidebar should include the coordinator section

## Shared Dependencies Expected By These Files

The copied files expect these existing modules in the target project:

- frontend `AdminLayout`
- frontend `api` service
- frontend `react-router-dom`
- frontend `lucide-react`
- backend Supabase config at `src/config/db`
- backend auth middleware if you keep protected form routes
- backend API helpers if you keep the form route responses as-is

If your target project uses different paths or helpers, update the imports after copying.

## Logo Handling

The exported coordinator PDF controller first checks:

- `coordinator/assets/MIT_ADTU.png`
- project root `MIT_ADTU.png`

So you can either keep the asset inside this bundle or place the logo at the root of the target project.

## Database

Run `coordinator/server/sql/coordinator-module.sql` in the target database.

It creates the tables used by this module:

- `placement_coordinators`
- `forms`
- `form_fields`
- `form_responses`

## Notes

- This is a copy/export bundle. It does not replace the live project files.
- The frontend files preserve the current professional letter-generation flow and coordinator forms UX.
- If you want this exported as a more self-contained package next, the next step would be extracting shared dependencies like `AdminLayout` and `api` into this bundle too.
