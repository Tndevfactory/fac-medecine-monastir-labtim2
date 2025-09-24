    // hashPassword.js
    const bcrypt = require('bcryptjs');

    const passwordToHash = 'labtim-pass-123'; // <-- CHANGE THIS to your desired password

    async function hashAndPrint() {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);
        console.log('Hashed Password:', hashedPassword);
      } catch (error) {
        console.error('Error hashing password:', error);
      }
    }

    hashAndPrint();
    