import { Test, TestingModule } from '@nestjs/testing';
import { MobileUsersService } from './mobile-users.service';
import { DbService } from '../../../db/db.service';

describe('MobileUsersService', () => {
  let service: MobileUsersService;
  let dbService: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileUsersService,
        {
          provide: DbService,
          useValue: {
            getPrisma: jest.fn().mockReturnValue({
              mobileUser: {
                findUnique: jest.fn(),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MobileUsersService>(MobileUsersService);
    dbService = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call findByMatricula with correct parameters', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      password: 'hashedpassword',
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    };
    const findUniqueSpy = jest
      .spyOn(dbService.getPrisma().mobileUser, 'findUnique')
      .mockResolvedValue(mockUser);

    const result = await service.findByMatricula('testuser');

    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: { username: 'testuser' },
    });
    expect(result).toEqual(mockUser);
  });

  it('should call findById with correct parameters', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      password: 'hashedpassword',
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    };
    const findUniqueSpy = jest
      .spyOn(dbService.getPrisma().mobileUser, 'findUnique')
      .mockResolvedValue(mockUser);

    const result = await service.findById(1);

    expect(findUniqueSpy).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockUser);
  });
});
