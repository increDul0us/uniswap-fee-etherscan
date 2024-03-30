import NodeConfig from 'config';

import IConfig from './default';

const config: typeof NodeConfig & IConfig = NodeConfig as unknown as IConfig & typeof NodeConfig;

export { config };
