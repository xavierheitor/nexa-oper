import { Test, TestingModule } from '@nestjs/testing';
import { MobileUsersService } from './mobile-users.service';

describe('MobileUsersService', () => {
  let service: MobileUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MobileUsersService],
    }).compile();

    service = module.get<MobileUsersService>(MobileUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
