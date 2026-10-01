import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Let\'s Start Untitle Corp Home Homepage !!';
  }
}
