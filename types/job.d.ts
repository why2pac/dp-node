import Config from '..';

export = {
  <T extends Config>(config: T): (Pick<T, 'helper' | 'model' | 'view'> => void) => Promise<never>
}
