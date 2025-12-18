/**
 * Routes Index
 * Centralizes route mounting and dependency injection
 */

import createCompaniesRouter from './companies.js';
import createAuditRouter from './audit.js';
import createAssetsRouter from './assets.js';

/**
 * Mount all route modules on the Express app
 * @param {Object} app - Express application
 * @param {Object} deps - Shared dependencies
 */
export function mountRoutes(app, deps) {
  // Assets routes
  const assetsDeps = {
    assetDb: deps.assetDb,
    userDb: deps.userDb,
    companyDb: deps.companyDb,
    auditDb: deps.auditDb,
    assetTypeDb: deps.assetTypeDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    upload: deps.upload,
    parseCSVFile: deps.parseCSVFile,
    syncAssetOwnership: deps.syncAssetOwnership,
  };
  const assetsRouter = createAssetsRouter(assetsDeps);
  app.use('/api/assets', assetsRouter);

  // Stats route (standalone endpoint for dashboard)
  app.get('/api/stats', deps.authenticate, async (req, res) => {
    try {
      const assets = await deps.assetDb.getAll();
      const users = await deps.userDb.getAll();
      const companies = await deps.companyDb.getAll();
      res.json({
        assetsCount: assets.length,
        employeesCount: users.length,
        companiesCount: companies.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Companies routes
  const companiesRouter = createCompaniesRouter({
    companyDb: deps.companyDb,
    auditDb: deps.auditDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
    upload: deps.upload,
    parseCSVFile: deps.parseCSVFile,
  });
  app.use('/api/companies', companiesRouter);

  // Audit routes
  const auditRouter = createAuditRouter({
    auditDb: deps.auditDb,
    userDb: deps.userDb,
    authenticate: deps.authenticate,
    authorize: deps.authorize,
  });
  app.use('/api/audit', auditRouter);

  console.log('Mounted route modules: assets, companies, audit');
}

export default mountRoutes;
