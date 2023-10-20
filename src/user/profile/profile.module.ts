import { GoogleStrategy } from '@@/auth/google.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [],
  providers: [GoogleStrategy],
})
export class ProfileModule {}
