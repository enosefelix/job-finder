import { faker } from '@faker-js/faker';

faker.seed(7819);

export const MailImageSeed = [
  {
    name: 'Mail Logo',
    code: 'mail-logo',
    logo: 'aHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZGpta3l4eGJjL2ltYWdlL3VwbG9hZC92MTY5NzYxNDYzOC9kZXZlbG9wbWVudC9odHRwczp3aGFsZS1hcHAtd3E3aGMub25kaWdpdGFsb2NlYW4uYXBwL2ltYWdlcy9tYWlsLWltYWdlcy9pLVdvcmstaW4tQWZyaWthX3Z5MXM4ei5wbmc=',
  },
].map((tmpl) => ({ id: faker.datatype.uuid(), ...tmpl }));
