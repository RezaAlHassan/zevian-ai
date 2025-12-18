import { testSupabaseConnection } from './utils/testConnection';

// Add this to your browser console to test the connection
console.log('🔍 Testing Supabase Connection...');
testSupabaseConnection().then(result => {
    if (result.success) {
        console.log('✅ Connection successful!', result.stats);
    } else {
        console.error('❌ Connection failed:', result.error);
    }
});
