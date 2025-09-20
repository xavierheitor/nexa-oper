import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';

@Injectable()
export class MobileUsersService {
  constructor(private readonly db: DatabaseService) {}

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
