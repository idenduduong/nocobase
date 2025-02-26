import { Plugin, PluginManager, getExposeUrl } from '@nocobase/server';
import fs from 'fs';
import { resolve } from 'path';
import { getAntdLocale } from './antd';
import { getCronLocale } from './cron';
import { getCronstrueLocale } from './cronstrue';

async function getLang(ctx) {
  const SystemSetting = ctx.db.getRepository('systemSettings');
  const systemSetting = await SystemSetting.findOne();
  const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
  const currentUser = ctx.state.currentUser;
  let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  if (enabledLanguages.includes(currentUser?.appLang)) {
    lang = currentUser?.appLang;
  }
  if (ctx.request.query.locale) {
    lang = ctx.request.query.locale;
  }
  return lang;
}

export class ClientPlugin extends Plugin {
  async beforeLoad() {
    // const cmd = this.app.findCommand('install');
    // if (cmd) {
    //   cmd.option('--import-demo');
    // }
    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {
        //
      }
    });

    this.db.on('systemSettings.beforeCreate', async (instance, { transaction }) => {
      const uiSchemas = this.db.getRepository<any>('uiSchemas');
      const schema = await uiSchemas.insert(
        {
          type: 'void',
          'x-component': 'Menu',
          'x-designer': 'Menu.Designer',
          'x-initializer': 'MenuItemInitializers',
          'x-component-props': {
            mode: 'mix',
            theme: 'dark',
            // defaultSelectedUid: 'u8',
            onSelect: '{{ onSelect }}',
            sideMenuRefScopeKey: 'sideMenuRef',
          },
          properties: {},
        },
        { transaction },
      );
      instance.set('options.adminSchemaUid', schema['x-uid']);
    });
  }

  async load() {
    this.app.locales.setLocaleFn('antd', async (lang) => getAntdLocale(lang));
    this.app.locales.setLocaleFn('cronstrue', async (lang) => getCronstrueLocale(lang));
    this.app.locales.setLocaleFn('cron', async (lang) => getCronLocale(lang));
    this.db.addMigrations({
      namespace: 'client',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
    this.app.acl.allow('app', 'getLang');
    this.app.acl.allow('app', 'getInfo');
    this.app.acl.allow('app', 'getPlugins');
    this.app.acl.allow('plugins', '*', 'public');
    this.app.acl.registerSnippet({
      name: 'app',
      actions: ['app:restart', 'app:clearCache'],
    });
    const dialect = this.app.db.sequelize.getDialect();
    const restartMark = resolve(process.cwd(), 'storage', 'restart');
    this.app.on('beforeStart', async () => {
      if (fs.existsSync(restartMark)) {
        fs.unlinkSync(restartMark);
      }
    });

    this.app.resource({
      name: 'app',
      actions: {
        async getInfo(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
          const currentUser = ctx.state.currentUser;
          let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
          if (enabledLanguages.includes(currentUser?.appLang)) {
            lang = currentUser?.appLang;
          }
          ctx.body = {
            database: {
              dialect,
            },
            version: await ctx.app.version.get(),
            lang,
            name: ctx.app.name,
            theme: currentUser?.systemSettings?.theme || systemSetting?.options?.theme || 'default',
          };
          await next();
        },
        async getLang(ctx, next) {
          const lang = await getLang(ctx);
          const resources = await ctx.app.locales.get(lang);
          ctx.body = {
            lang,
            ...resources,
          };
          await next();
        },
        async getPlugins(ctx, next) {
          const pm = ctx.db.getRepository('applicationPlugins');
          const PLUGIN_CLIENT_ENTRY_FILE = 'dist/client/index.js';
          const items = await pm.find({
            filter: {
              enabled: true,
            },
          });
          ctx.body = items
            .map((item) => {
              try {
                const packageName = PluginManager.getPackageName(item.name);
                return {
                  ...item.toJSON(),
                  packageName,
                  url: getExposeUrl(packageName, PLUGIN_CLIENT_ENTRY_FILE),
                };
              } catch {
                return false;
              }
            })
            .filter(Boolean);
          await next();
        },
        async clearCache(ctx, next) {
          await ctx.cache.reset();
          await next();
        },
        async restart(ctx, next) {
          ctx.app.runAsCLI(['restart'], { from: 'user' });
          await next();
        },
      },
    });
  }
}

export default ClientPlugin;
