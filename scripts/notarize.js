const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (process.env.MILY_UNSIGNED === '1') return;

  const appName = context.packager.appInfo.productFilename;

  console.log('Starting notarization for', appName);
  console.log('App path:', `${appOutDir}/${appName}.app`);

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.warn('Apple notarization credentials are incomplete. Skipping notarization.');
    return;
  }

  try {
    console.log('Submitting to Apple notarization service...');
    await notarize({
      appBundleId: context.packager.appInfo.id,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    console.log('Notarization complete for', appName);
  } catch (error) {
    console.error('Notarization failed:', error.message);
    throw error;
  }
};


