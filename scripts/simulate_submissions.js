const http = require('http');

/**
 * INSTRUCTIONS:
 * 1. Ensure your server is running (usually http://localhost:5000)
 * 2. Run this script: node scripts/simulate_submissions.js <FORM_SLUG> <COUNT>
 */

const API_HOST = 'localhost';
const API_PORT = 5001;
const API_PATH_PREFIX = '/api/forms';

const slug = process.argv[2];
const count = parseInt(process.argv[3]) || 10;

if (!slug) {
    console.error('Usage: node simulate_submissions.js <slug> <count>');
    process.exit(1);
}

function postSubmission(i) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            answers: {
                "dummy": `Test User ${i}`,
                "email": `test${i}@placepro.edu`
            }
        });

        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: `${API_PATH_PREFIX}/public/${slug}/submit`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                reject(new Error(`Status: ${res.statusCode}`));
            }
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function simulate() {
    console.log(`🚀 Starting stress test for form: ${slug}`);
    console.log(`📊 Total dummy submissions to send: ${count}`);

    const startTime = Date.now();
    let success = 0;
    let failed = 0;

    const batches = Math.ceil(count / 20);

    for (let b = 0; b < batches; b++) {
        const batchPromises = [];
        const start = b * 20;
        const end = Math.min((b + 1) * 20, count);

        for (let i = start + 1; i <= end; i++) {
            batchPromises.push(
                postSubmission(i)
                    .then(() => { success++; process.stdout.write('✅'); })
                    .catch((err) => {
                        failed++;
                        process.stdout.write('❌');
                        if (failed <= 10) console.error(`\nError on req ${i}:`, err.message);
                    })
            );
        }

        await Promise.all(batchPromises);
        // No delay between batches for max burst
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log('\n\n--- Results ---');
    console.log(`Status: ${failed === 0 ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Avg Speed: ${(count / duration).toFixed(2)} req/sec`);
    console.log('----------------\n');
}

simulate().catch(console.error);
