import { EtherscanService } from './etherscan.service';

export class UsdcEtherscanService extends EtherscanService {
  static singleton: UsdcEtherscanService;

  constructor() {
    super('0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640');
  }

  static getSingleton(): UsdcEtherscanService {
    if (!UsdcEtherscanService.singleton) {
      UsdcEtherscanService.singleton = new UsdcEtherscanService();
    }
    return UsdcEtherscanService.singleton;
  }
}