const bcrypt = require('bcrypt');

const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaJqzQNjXb5dD4JFd1YGtY.mG';
const password = 'Admin2024!';

bcrypt.compare(password, hash).then(res => {
    console.log('Match:', res);
}).catch(err => {
    console.error('Error:', err);
});
