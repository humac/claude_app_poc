import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { closeConnection } from './database.js';

/**
 * Sets up an isolated test database path and provides a cleanup function.
 * @param {string} testName - Unique name for the test suite (used in filename)
 * @returns {object} Object containing dbPath and cleanup function
 */
export const setupTestDb = (testName) => {
    // Sanitize test name
    const safeName = testName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const dbPath = resolve(process.cwd(), 'data', `test-${safeName}.db`);

    const cleanup = () => {
        closeConnection();
        if (existsSync(dbPath)) {
            try {
                unlinkSync(dbPath);
            } catch (err) {
                console.warn(`Failed to cleanup test DB ${dbPath}:`, err.message);
            }
        }
    };

    return { dbPath, cleanup };
};
