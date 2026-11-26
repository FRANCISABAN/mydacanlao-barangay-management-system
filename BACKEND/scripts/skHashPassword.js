// Makes a bcrypt hash so you can add a new SK officer in SQL.
//   node scripts/skHashPassword.js MyStrongPassword
import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw) {
    console.log('Usage: node scripts/skHashPassword.js <password>');
    process.exit(1);
}
console.log(bcrypt.hashSync(pw, bcrypt.genSaltSync(10)));