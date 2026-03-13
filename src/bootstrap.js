'use strict';

async function ensurePublicPermissions(controllers) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
    populate: ['permissions'],
  });

  const existingActions = new Set(
    (publicRole.permissions || []).map((p) => p.action)
  );

  const toCreate = [];
  for (const controller of Object.keys(controllers)) {
    for (const action of controllers[controller]) {
      const actionKey = `api::${controller}.${controller}.${action}`;
      if (!existingActions.has(actionKey)) {
        toCreate.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionKey, role: publicRole.id },
          })
        );
      }
    }
  }

  if (toCreate.length > 0) {
    await Promise.all(toCreate);
    console.log(`Created ${toCreate.length} missing public permissions.`);
  } else {
    console.log('All public permissions already set.');
  }
}

module.exports = async () => {
  try {
    await ensurePublicPermissions({
      article: ['find', 'findOne'],
      category: ['find', 'findOne'],
      advisor: ['find', 'findOne'],
    });
  } catch (err) {
    console.error('Bootstrap permission setup failed:', err.message);
  }
};
