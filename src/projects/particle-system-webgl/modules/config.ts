import { GUI } from 'dat.gui';

export type ConfigurationItem = {
  value: number | boolean | string;
  gui: {
    type: 'range' | 'bool' | 'list' | 'color';
    order?: number;
    onChangeFunc?: 'onChange' | 'onFinishChange';
    from?: number;
    to?: number;
    listValues?: Record<string, number>;
    listen?: boolean;
    step?: number;
    onChange?: (value: number | string | boolean) => void;
  };
};
export default class AppConfig {
  gui: GUI;
  configuration: Record<string, ConfigurationItem>;
  values: Record<string, boolean | string | number>;

  constructor(configuration: Record<string, ConfigurationItem>) {
    this.values = {};

    this.configuration = configuration;

    Object.keys(configuration).forEach((key) => {
      Object.defineProperty(this.values, key, {
        configurable: true,
        enumerable: true,
        get() {
          return configuration[key].value;
        },
        set(newValue) {
          configuration[key].value = newValue;
        },
      });
    });

    this.gui = new GUI();
    this.configureGui(configuration);
  }

  configureGui(configuration: Record<string, ConfigurationItem>) {
    const keys = Object.keys(configuration);

    keys
      .sort(
        (k1, k2) =>
          (configuration[k2].gui.order ?? 0) -
          (configuration[k1].gui.order ?? 0),
      )
      .forEach((key) => {
        const value = configuration[key];
        let guiEntry;

        switch (value.gui.type) {
          case 'bool':
            guiEntry = this.gui.add(this.values, key);
            break;
          case 'range':
            guiEntry = this.gui.add(
              this.values,
              key,
              value.gui.from,
              value.gui.to,
            );

            if (value.gui.step) {
              guiEntry.step(value.gui.step);
            }
            break;
          case 'color':
            guiEntry = this.gui.addColor(this.values, key);
            break;
          case 'list':
            if (!value.gui.listValues) {
              return;
            }

            guiEntry = this.gui.add(this.values, key, value.gui.listValues);
            break;
          default:
            console.error('Unsupported GUI type');
            return;
        }

        if (value.gui.onChange && value.gui.onChangeFunc) {
          guiEntry[value.gui.onChangeFunc](value.gui.onChange);
        }

        if (value.gui.listen) {
          guiEntry.listen();
        }
      });
  }
}
