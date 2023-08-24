import { faker } from '@faker-js/faker';
import { ROLE_TYPE } from '../interfaces';

const roles = [
  {
    name: 'User',
    description: 'This role is assigned to Base users.',
    code: ROLE_TYPE.USER,
  },
  {
    name: 'Administrators',
    description:
      'This is the role assigned to anyone with full access to the Admin module which grants the rights to administer the system.',
    code: ROLE_TYPE.ADMIN,
  },
];

faker.seed(11224);

export const roleSeed = roles.map((role) => ({
  ...role,
  id: faker.string.uuid(),
}));
