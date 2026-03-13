'use strict';

async function ensurePublicPermissions(newPermissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  const existingPerms = await strapi.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id },
  });
  const existingActions = new Set(existingPerms.map((p) => p.action));

  const toCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    actions.forEach((action) => {
      const actionKey = `api::${controller}.${controller}.${action}`;
      if (!existingActions.has(actionKey)) {
        toCreate.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionKey, role: publicRole.id },
          })
        );
      }
    });
  });

  if (toCreate.length > 0) {
    await Promise.all(toCreate);
    console.log(`Created ${toCreate.length} missing public permissions.`);
  }
}

module.exports = async () => {
  console.log('Ensuring public API permissions...');
  await ensurePublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    advisor: ['find', 'findOne'],
  });
  console.log('Public permissions configured.');
};
