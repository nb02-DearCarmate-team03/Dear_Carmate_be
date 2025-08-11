// hash-test.ts
import bcrypt from 'bcrypt';

(async () => {
  const hashed = await bcrypt.hash('Password_10', 10);
  console.log("해시된 비밀번호:", hashed);
})();
