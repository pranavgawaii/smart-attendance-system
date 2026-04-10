require('dotenv').config();
const { supabase } = require('../src/config/db');

/**
 * Run this script: node scripts/cleanup_test_data.js <FORM_SLUG>
 */

const slug = process.argv[2];

if (!slug) {
    console.error('Usage: node cleanup_test_data.js <slug>');
    process.exit(1);
}

async function cleanup() {
    console.log(`🧹 Cleaning up test data for form: ${slug}`);

    try {
        // 1. Get form ID
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('id')
            .eq('slug', slug)
            .single();

        if (formError || !form) {
            console.error('Form not found.');
            process.exit(1);
        }

        // 2. Delete test responses (look for 'Test User' or 'Dummy' in answers)
        // Note: For simplicity, if it's a test run, we might want to delete ALL responses
        // BUT it's safer to only delete those with test markers.
        const { count, error: deleteError } = await supabase
            .from('form_responses')
            .delete()
            .eq('form_id', form.id)
            .filter('answers->>dummy', 'ilike', 'Test User%');

        if (deleteError) throw deleteError;

        console.log(`✅ Successfully deleted test responses.`);
    } catch (err) {
        console.error('Cleanup failed:', err.message);
    }
    process.exit(0);
}

cleanup();
