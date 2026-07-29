const { test: baseTest, expect } = require('@playwright/test');
const path = require('path');
const { resolveAdminTestUrl } = require('./admin-url');

const ADMIN_STATE = path.resolve(__dirname, '../../auth/admin-state.json');

const test = baseTest.extend({});

test.use({ storageState: ADMIN_STATE });

module.exports = {
	test,
	expect,
	ADMIN_STATE,
	resolveAdminTestUrl,
};