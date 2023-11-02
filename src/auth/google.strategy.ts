import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: `${process.env.APP_HOST}/google/redirect`,
      scope: ['email', 'profile'],
    });
  }

  async clientValidate(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const { data } = response;
      const { email, given_name, family_name, picture } = data;
      const user = {
        email,
        firstName: given_name,
        lastName: family_name,
        picture: picture,
      };
      return user;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        accessToken,
      };
      done(null, user);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
