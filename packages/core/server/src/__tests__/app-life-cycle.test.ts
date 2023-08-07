import Application, { ApplicationOptions } from '../application';
import { createAppProxy } from '../helper';
import Plugin from '../plugin';
import { AddPresetError } from '../plugin-manager';

const mockServer = (options?: ApplicationOptions) => {
  return new Application({
    database: {
      dialect: 'sqlite',
      storage: ':memory:',
    },
    ...options,
  });
};

describe('application life cycle', () => {
  let app: Application;

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  describe('reInitEvents', () => {
    it('should be called', async () => {
      app = mockServer();
      const loadFn = jest.fn();
      app.on('event1', () => {
        loadFn();
      });
      app.reInitEvents();
      app.emit('event1');
      expect(loadFn).toBeCalled();
      expect(loadFn).toBeCalledTimes(1);
    });

    it('should not be called', async () => {
      app = createAppProxy(mockServer());
      const loadFn = jest.fn();
      app.on('event1', () => {
        loadFn();
      });
      app.reInitEvents();
      app.emit('event1');
      expect(loadFn).not.toBeCalled();
    });
  });

  describe('load', () => {
    it('should be called', async () => {
      app = mockServer();
      const loadFn = jest.fn();
      app.on('beforeLoad', () => {
        loadFn();
      });

      await app.load();
      await app.load();
      expect(loadFn).toBeCalled();
      expect(loadFn).toBeCalledTimes(1);
      await app.reload();
      await app.reload();

      expect(app.listenerCount('beforeLoad')).toBe(1);

      expect(loadFn).toBeCalledTimes(3);
    });
    it('should be called', async () => {
      app = mockServer();
      const loadFn = jest.fn();
      class Plugin1 extends Plugin {
        afterAdd() {
          this.app.on('beforeLoad', () => {
            loadFn();
          });
        }
      }
      app.pm.addPreset(Plugin1);
      await app.load();
      await app.load();
      expect(loadFn).toBeCalled();
      expect(loadFn).toBeCalledTimes(1);
      await app.reload();
      await app.reload();
      expect(loadFn).toBeCalledTimes(3);
    });
  });

  describe('addPreset', () => {
    it('should init after app.load()', async () => {
      class Plugin1 extends Plugin {}
      app = mockServer({
        plugins: [Plugin1],
      });
      expect(app.pm.has(Plugin1)).toBeFalsy();
      await app.load();
      expect(app.pm.has(Plugin1)).toBeTruthy();
    });

    it('should init after app.load()', async () => {
      class Plugin1 extends Plugin {}
      class Plugin2 extends Plugin {}
      app = mockServer({
        plugins: [Plugin1],
      });
      app.pm.addPreset(Plugin2);
      expect(app.pm.has(Plugin1)).toBeFalsy();
      expect(app.pm.has(Plugin2)).toBeFalsy();
      await app.load();
      expect(app.pm.has(Plugin1)).toBeTruthy();
      expect(app.pm.has(Plugin2)).toBeTruthy();
    });

    it('should throw error', async () => {
      class Plugin1 extends Plugin {}
      app = mockServer();
      await app.load();
      expect(() => app.pm.addPreset(Plugin1)).toThrow(AddPresetError);
    });
  });
});
