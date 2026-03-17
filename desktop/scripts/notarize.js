const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log('Starting notarization for', appName);
  console.log('App path:', `${appOutDir}/${appName}.app`);

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.warn('APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD is not set. Skipping notarization.');
    return;
  }

  try {
    console.log('Submitting to Apple notarization service...');
    await notarize({
      appBundleId: 'com.mily.app',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: '76FZS6K46G',
    });
    console.log('Notarization complete for', appName);
  } catch (error) {
    console.error('Notarization failed:', error.message);
    throw error;
  }
};


