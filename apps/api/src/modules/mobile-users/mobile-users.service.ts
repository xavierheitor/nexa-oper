import { Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.service';

@Injectable()
export class MobileUsersService {
  constructor(private readonly db: DbService) {}

  async findByMatricula(username: string) {
    return await this.db.getPrisma().mobileUser.findUnique({
      where: { username },
    });
  }

  async findById(id: number) {
    return await this.db.getPrisma().mobileUser.findUnique({
      where: { id },
    });
  }
}
